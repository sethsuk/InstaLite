package edu.upenn.cis.nets2120.hw3;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;
import org.apache.commons.lang3.tuple.ImmutablePair;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.storage.SparkConnector;
import scala.Tuple2;

public class FriendsOfFriendsSpark {
    static Logger logger = LogManager.getLogger(FriendsOfFriendsSpark.class);

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public FriendsOfFriendsSpark() {
        System.setProperty("file.encoding", "UTF-8");
    }

    /**
     * Initialize the database connection. Do not modify this method.
     *
     * @throws InterruptedException User presses Ctrl-C
     */
    public void initialize() throws InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        logger.debug("Connected!");
    }

    /**
     * Fetch the social network from mysql using a JDBC connection, and create a (followed, follower) edge graph
     *
     * @return JavaPairRDD: (followed: String, follower: String) The social network
     */
    public JavaPairRDD<String, String> getSocialNetworkFromJDBC() {
        try {
            logger.info("Connecting to database...");
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                logger.error("Connection to database failed: " + e.getMessage(), e);
                logger.error("Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                System.exit(1);
            }

            if (connection == null) {
                logger.error("Failed to make connection - Connection is null");
                System.exit(1);
            }

            logger.info("Successfully connected to database!");
            ResultSet result = connection.createStatement().executeQuery("SELECT DISTINCT followed, follower FROM friends ORDER BY followed LIMIT 500;");
            List<Tuple2<String, String>> l = new ArrayList<>();            
            while(result.next()){
                l.add(new Tuple2<>(result.getString("follower"), result.getString("followed")));
            }

            return context.parallelize(l).mapToPair(entry -> entry);
             
             

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>("", ""));
    }

    /**
     * Friend-of-a-Friend Recommendation Algorithm
     *
     * @param network JavaPairRDD: (followed: String, follower: String) The social network
     * @return JavaPairRDD: ((person, recommendation), strength) The friend-of-a-friend recommendations
     */
    private JavaPairRDD<Tuple2<String, String>, Integer> friendOfAFriendRecommendations(
            JavaPairRDD<String, String> network) {
        // (u, v) -> ((u, v), 1) - used for subtracting
        JavaPairRDD<Tuple2<String, String>, Integer> fEdges = network.mapToPair(entry -> 
                                        new Tuple2<>(new Tuple2<>(entry._1(), entry._2()), 1));
        // v -> (u, v)
        JavaPairRDD<String, String> toNByDest = network.mapToPair(entry -> new Tuple2<>(entry._2(), entry._1()));
        
        // Join by v, where (u, v) key v has value u in toNByDest and (v, w) has value w in network
        return toNByDest.join(network)
        // Remove v, consider u and w
        .mapToPair(entry -> new Tuple2<String, String>(entry._2()._1(), entry._2()._2()))
        // Make sure u != w
        .filter(entry -> !entry._1().equals(entry._2()))
        // map (u, w) to ((u, w), 1)
        .mapToPair(entry -> new Tuple2<Tuple2<String, String>, Integer>(entry, 1))
        // Remove (u, w) if it is already an edge in the network
        .subtract(fEdges)
        // Sum all pairs up by the reccommendation value
        .reduceByKey((v1, v2) -> v1 + v2);
    }

    /**
     * Send recommendation results back to the database
     *
     * @param recommendations List: (followed: String, follower: String)
     *                        The list of recommendations to send back to the database
     */
    public void sendResultsToDatabase(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
            JavaRDD<Tuple2<Tuple2<String,String>,Integer>> recStream = context.parallelize(recommendations);
            List<String> l = recStream.map(entry -> 
                "INSERT INTO recommendations VALUES ('" + entry._1()._1() + "', '"+ entry._1()._2() + "', "+ entry._2() +  ");"
            ).collect();
         
            if(l.size() > 0){
                for(int i = 0; i < l.size(); i++){
                    try{
                        connection.prepareStatement(l.get(i)).executeUpdate();
                    } catch (SQLException e) {
                        System.err.println("Error creating recommendations table: " + e.getMessage());
                        throw e;
                    }
                }
            }

        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }

    /**
     * Write the recommendations to a CSV file. Do not modify this method.
     *
     * @param recommendations List: (followed: String, follower: String)
     */
    public void writeResultsCsv(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        // Create a new file to write the recommendations to
        File file = new File("recommendations_2.csv");
        try (PrintWriter writer = new PrintWriter(file)) {
            // Write the recommendations to the file
            for (Tuple2<Tuple2<String, String>, Integer> recommendation : recommendations) {
                writer.println(recommendation._1._1 + "," + recommendation._1._2 + "," + recommendation._2);
            }
        } catch (Exception e) {
            logger.error("Error writing recommendations to file: " + e.getMessage(), e);
        }
    }

    /**
     * Main functionality in the program: read and process the social network. Do not modify this method.
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        // Load the social network:
        // Format of JavaPairRDD = (followed, follower)
        JavaPairRDD<String, String> network = getSocialNetworkFromJDBC();

        // Friend-of-a-Friend Recommendation Algorithm:
        // Format of JavaPairRDD = ((person, recommendation), strength)
        JavaPairRDD<Tuple2<String, String>, Integer> recommendations = friendOfAFriendRecommendations(network);

        // Collect results and send results back to database:
        // Format of List = ((person, recommendation), strength)
        if (recommendations == null) {
            logger.error("Recommendations are null");
            return;
        }
        List<Tuple2<Tuple2<String, String>, Integer>> collectedRecommendations = recommendations.collect();
        writeResultsCsv(collectedRecommendations);
        sendResultsToDatabase(collectedRecommendations);

        logger.info("*** Finished friend of friend recommendations! ***");
    }

    /**
     * Graceful shutdown
     */
    public void shutdown() {
        logger.info("Shutting down");

        if (spark != null) {
            spark.close();
        }
    }

    public static void main(String[] args) {
        final FriendsOfFriendsSpark fofs = new FriendsOfFriendsSpark();
        try {
            fofs.initialize();
            fofs.run();
        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            fofs.shutdown();
        }
    }
}
