package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.storage.SparkConnector;
import scala.Tuple2;

public class ComputeRanks {
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public ComputeRanks() {
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
    public Connection getJDBCConnection() {
    
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
        return connection;
        
    }


    private JavaPairRDD<String, String> getEdges(Connection connection, String table, String field1, String field2) {
        try {
            ResultSet result = connection.createStatement().executeQuery("SELECT DISTINCT " + field1+", "+field2 +" FROM "+table+";");
            List<Tuple2<String, String>> l = new ArrayList<>();            
            while(result.next()){
                // Add char in front of ids to ensure ids are unique across all tables
                if (table != "friends") {
                    l.add(new Tuple2<>(field1.charAt(0) + String.valueOf(result.getInt(field1)), field2.charAt(0) + String.valueOf(result.getInt(field2))));
                } else {
                    l.add(new Tuple2<>("u" + String.valueOf(result.getInt(field1)), "u" + String.valueOf(result.getInt(field2))));
                }
            }

            return context.parallelize(l).mapToPair(entry -> entry);
        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        return context.emptyRDD().mapToPair(x -> new Tuple2<>("", ""));
    }

    protected JavaPairRDD<String, Double> createRankContribs(JavaPairRDD<String, String> edgeRDD, JavaPairRDD<String, Double> previousRanks, Double spreadAmt) {
        // Find outdegree of each vertex
        JavaPairRDD<String, Integer> numOutboundEdges = edgeRDD.mapToPair((edge) -> new Tuple2<>(edge._1(), 1)).reduceByKey((v1, v2) -> v1 + v2);
        // Get the value that people who have an inbound edge from a vertex should recieve
        JavaPairRDD<String, Double> toPropagate = numOutboundEdges.mapToPair((node) -> new Tuple2<>(node._1(), spreadAmt/node._2())).join(previousRanks).mapToPair((pair) -> new Tuple2<>(pair._1(), pair._2()._1() * pair._2()._2()));
        // Create rank contributions for each edge, mapping the value that should be propagated
        JavaPairRDD<String, Double> rankContribs = edgeRDD.join(toPropagate).mapToPair(edge -> new Tuple2<>(edge._2()._1(), edge._2()._2()));
        return rankContribs;
    }

    /**
     * Send rank results back to the database
     *
     * @param ranks List: The list of recommendations to send back to the database
     */
    public void sendResultsToDatabase(JavaPairRDD<String, Double> ranks, String table_name) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
            List<String> l = ranks.map(entry -> 
                "INSERT INTO " + table_name + " VALUES ('" + entry._1() + "', '"+ entry._2() + ");"
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
     * Main functionality in the program: read and process the social network. Do not modify this method.
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        Double d_max = 30.0;
        Double i_max = 15.0;

        Connection connection = getJDBCConnection();

        // Get RDDs for userToHashtag, hashtagToPost, userToPost, and userToUser (all RDDs are follower to followed)
        JavaPairRDD<String, String> userToHashtag = getEdges(connection, "user_hashtags", "user_id", "hashtag_id");
        JavaPairRDD<String, String> hashtagToPost = getEdges(connection, "hashtags_to_posts", "hashtag_id", "post_id");;
        JavaPairRDD<String, String> userToPost = getEdges(connection, "post_likes", "user_id", "post_id");;
        JavaPairRDD<String, String> userToUser = getEdges(connection, "friends", "followed", "follower");
        JavaPairRDD<String, String>[] edgeRDDs = new JavaPairRDD[]{userToHashtag, hashtagToPost, userToPost, userToUser};

        // Get all outbound edges for hashtags and posts
        JavaPairRDD<String, String> hashTagOutbound = userToHashtag.mapToPair(e -> new Tuple2<>(e._2(), e._1())).union(hashtagToPost);
        JavaPairRDD<String, String> postOutbound = userToPost.mapToPair(e -> new Tuple2<>(e._2(), e._1())).union(hashtagToPost.mapToPair(e -> new Tuple2<>(e._2(), e._1())));
        
        JavaRDD<String> allNodes = context.emptyRDD();
        for (JavaPairRDD<String, String> RDD: edgeRDDs) {
            allNodes = allNodes.union(RDD.keys()).union(RDD.values());

        }

        JavaPairRDD<String, Double> previousRank = allNodes.distinct().mapToPair(node -> new Tuple2<>(node, 1.0));
        JavaPairRDD<String, Double> newRank;

        int iterations = 0;
        Double maxDifference;
        do {
            iterations++;
            
            // Get rank contributions from individual types of edges
            JavaPairRDD<String, Double> rankContribs = createRankContribs(hashTagOutbound, previousRank, 1.0);
            rankContribs = rankContribs.union(createRankContribs(postOutbound, previousRank, 1.0));
            rankContribs = rankContribs.union(createRankContribs(userToHashtag, previousRank, 0.3));
            rankContribs = rankContribs.union(createRankContribs(userToPost, previousRank, 0.4));
            rankContribs = rankContribs.union(createRankContribs(userToUser, previousRank, 0.3));

            // Calculate the total rank from all sources
            newRank = rankContribs.reduceByKey((v1, v2) -> v1 + v2);

            // Subtract the ranks from each other and find the largest absolute difference
            JavaPairRDD<String, Double> differences = newRank.join(previousRank).mapToPair(entry -> new Tuple2<>(entry._1(), Math.abs(entry._2()._2() - entry._2()._1())));
            maxDifference = differences.values().reduce((v1,v2) -> Math.max(v1, v2));
            previousRank = newRank;

            System.out.println("Max difference for iteration " + iterations + ": " + maxDifference);
        } while (maxDifference > d_max && iterations < i_max);
        // Sort by rank in descending order
        newRank = previousRank;
        newRank = newRank.mapToPair(entry -> new Tuple2<>(entry._2(), entry._1())).sortByKey(false).mapToPair(entry -> new Tuple2<>(entry._2(), entry._1()));
        
        // TODO: write results to users_rank, hashtags_rank, posts_rank
        JavaPairRDD<String, Double> users_rank = newRank.filter(rank -> rank._1().charAt(0) == 'u');
        JavaPairRDD<String, Double> hashtags_rank = newRank.filter(rank -> rank._1().charAt(0) == 'h');
        JavaPairRDD<String, Double> posts_rank = newRank.filter(rank -> rank._1().charAt(0) == 'p');
        
        sendResultsToDatabase(users_rank, "user_rank");
        sendResultsToDatabase(hashtags_rank, "hashtag_rank");
        sendResultsToDatabase(posts_rank, "post_rank");

        logger.info("*** Finished social ranks! ***");
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
        final ComputeRanks fofs = new ComputeRanks();
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
