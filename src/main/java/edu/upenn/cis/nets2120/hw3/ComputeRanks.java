package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;

import edu.upenn.cis.nets2120.config.Config;

import scala.Tuple2;

import java.util.*;
import java.lang.Math;

public class ComputeRanks extends SparkJob<List<Tuple2<String, Double>>> {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 1000;

    public ComputeRanks(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Fetch the social network from the S3 path, and create a (followed, follower)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);
        return file.map(line -> line.split("\\s")).mapToPair(list -> new Tuple2<>(list[1], list[0])).distinct();
    }

    //user_hashtags
    protected JavaPairRDD<String, String> getUserToHashTag(String filePath) {

        Dataset<Row> dataset = spark.read().format("jdbc")
        .option("url", "jdbc:mysql://"+Config.RDS_LOCATION+"/imdbdatabase")
        .option("dbtable", "recommendations")
        .option("user", "admin")
        .option("password", "rds-password")
        .load();

        JavaRDD<Row> rdd = dataset.rdd().toJavaRDD();
        JavaPairRDD<String, String> pairRdd = rdd.mapToPair(entry -> new Tuple2<>(Integer.valueOf(entry.getInt(0)).toString(), Integer.valueOf(entry.getInt(1)).toString()));
        return pairRdd;

        // JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        // return file.map(line -> line.split("\\s")).mapToPair(list -> new Tuple2<>(list[1], list[0])).distinct();
    }

    // hashtags_to_posts
    protected JavaPairRDD<String, String> getHashTagToPost(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        return file.map(line -> line.split("\\s")).mapToPair(list -> new Tuple2<>(list[1], list[0])).distinct();
    }


    // likes
    protected JavaPairRDD<String, String> getUserToPost(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        return file.map(line -> line.split("\\s")).mapToPair(list -> new Tuple2<>(list[1], list[0])).distinct();
    }

    // friends
    protected JavaPairRDD<String, String> getUserToUser(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        return file.map(line -> line.split("\\s")).mapToPair(list -> new Tuple2<>(list[1], list[0])).distinct();
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
     * Main functionality in the program: read and process the social network
     * Runs the SocialRank algorithm to compute the ranks of nodes in a social network.
     *
     * @param debug a boolean value indicating whether to enable debug mode
     * @return a list of tuples containing the node ID and its corresponding SocialRank value
     * @throws IOException          if there is an error reading the social network data
     * @throws InterruptedException if the execution is interrupted
     */
    public List<Tuple2<String, Double>> run(boolean debug) throws IOException, InterruptedException {       
        System.out.println("Running");


        // TODO: Ensure that the ids being read in can be differentiated by the type of object they are 
        
        // Get RDDs for userToHashtag, hashtagToPost, userToPost, and userToUser (all RDDs are follower to followed)
        JavaPairRDD<String, String> userToHashtag = getUserToHashTag(Config.SOCIAL_NET_PATH);
        // JavaPairRDD<String, String> hashtagToPost = getHashTagToPost(Config.SOCIAL_NET_PATH);
        // JavaPairRDD<String, String> userToPost = getUserToPost(Config.SOCIAL_NET_PATH);
        // JavaPairRDD<String, String> userToUser = getUserToUser(Config.SOCIAL_NET_PATH);
        // JavaPairRDD<String, String>[] edgeRDDs = new JavaPairRDD[]{userToHashtag, hashtagToPost, userToPost, userToUser};
        JavaPairRDD<String, String>[] edgeRDDs = new JavaPairRDD[]{userToHashtag};

        // // Get all outbound edges for hashtags and posts
        // JavaPairRDD<String, String> hashTagOutbound = userToHashtag.mapToPair(e -> new Tuple2<>(e._2(), e._1())).union(hashtagToPost);
        // JavaPairRDD<String, String> postOutbound = userToPost.mapToPair(e -> new Tuple2<>(e._2(), e._1())).union(hashtagToPost.mapToPair(e -> new Tuple2<>(e._2(), e._1())));
        
        JavaRDD<String> allNodes = new JavaRDD<String>(null, null);
        for (JavaPairRDD<String, String> RDD: edgeRDDs) {
            allNodes = allNodes.union(RDD.keys()).union(RDD.values());

        }

        JavaPairRDD<String, Double> previousRank = allNodes.distinct().mapToPair(node -> new Tuple2<>(node, 1.0));
        JavaPairRDD<String, Double> newRank;

        // int iterations = 0;
        // Double maxDifference;
        // do {
        //     iterations++;
            
        //     // Get rank contributions from individual types of edges
        //     JavaPairRDD<String, Double> rankContribs = createRankContribs(hashTagOutbound, previousRank, 1.0);
        //     rankContribs = rankContribs.union(createRankContribs(postOutbound, previousRank, 1.0));
        //     rankContribs = rankContribs.union(createRankContribs(userToHashtag, previousRank, 0.3));
        //     rankContribs = rankContribs.union(createRankContribs(userToPost, previousRank, 0.4));
        //     rankContribs = rankContribs.union(createRankContribs(userToUser, previousRank, 0.3));

        //     // Calculate the total rank from all sources
        //     newRank = rankContribs.reduceByKey((v1, v2) -> v1 + v2);

        //     // Subtract the ranks from each other and find the largest absolute difference
        //     JavaPairRDD<String, Double> differences = newRank.join(previousRank).mapToPair(entry -> new Tuple2<>(entry._1(), Math.abs(entry._2()._2() - entry._2()._1())));
        //     maxDifference = differences.values().reduce((v1,v2) -> Math.max(v1, v2));
        //     previousRank = newRank;

        //     System.out.println("Max difference for iteration " + iterations + ": " + maxDifference);
        // } while (maxDifference > this.d_max && iterations < this.i_max);
        // // Sort by rank in descending order
        newRank = previousRank;
        newRank = newRank.mapToPair(entry -> new Tuple2<>(entry._2(), entry._1())).sortByKey(false).mapToPair(entry -> new Tuple2<>(entry._2(), entry._1()));
        
        // TODO: write results to users_rank, hashtags_rank, posts_rank
        // posts_rank = newRank.filter(entry -> entry._1()[0].equals('p'))


       
        return newRank.collect();
    }
}
