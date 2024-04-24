package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

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

    /**
     * Retrieves the sinks in the provided graph.
     *
     * @param network The input graph represented as a JavaPairRDD.
     * @return A JavaRDD containing the nodes with no outgoing edges.
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        JavaRDD<String> hasOutgoing = network.map(edge -> edge._2()).distinct();
        JavaRDD<String> allNodes = network.map(edge -> edge._1()).distinct();
        return allNodes.subtract(hasOutgoing);       
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
        // Load the social network, aka. the edges (followed, follower)
        JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH);

        logger.info("This graph contains {} nodes and {} edges", edgeRDD.values().distinct().count(), edgeRDD.count());

        // Find the sinks in edgeRDD as PairRDD
        JavaRDD<String> sinks = getSinks(edgeRDD);
        logger.info("There are {} sinks", sinks.count());

        JavaPairRDD<String, String> backlinks = sinks.mapToPair(sink -> new Tuple2<>(sink, sink)).join(edgeRDD).mapToPair(e -> new Tuple2<>(e._2()._2(), e._2()._1()));
        logger.info("Added {} backlinks", backlinks.count());

        edgeRDD = edgeRDD.union(backlinks);

        JavaPairRDD<String, Integer> numOutgoingEdges = edgeRDD.mapToPair(edge -> new Tuple2<>(edge._2(), 1)).reduceByKey((v1, v2) -> v1 + v2);
        JavaPairRDD<String, Double> nodeTransferRDD = numOutgoingEdges.mapToPair(node -> new Tuple2<>(node._1(), (1.0/node._2())));
        JavaRDD<String> allNodes = edgeRDD.map(e -> e._1()).union(edgeRDD.map(e -> e._2()));
        JavaPairRDD<String, Double> previousRank = allNodes.distinct().mapToPair(node -> new Tuple2<>(node, 1.0));
        JavaPairRDD<String, Double> newRank;
        JavaPairRDD<String, String> flipped = edgeRDD.mapToPair(e -> new Tuple2<>(e._2(), e._1()));

        int iterations = 0;
        Double maxDifference;
        do {
            iterations++;
            // Calculate the values that should be propagated to people followed by each node
            JavaPairRDD<String, Double> toPropagate = nodeTransferRDD.join(previousRank).mapToPair(node -> new Tuple2<>(node._1(), node._2()._1() * node._2()._2()));
            
            
            JavaPairRDD<String, Double> messages = flipped.join(toPropagate).mapToPair(edge -> new Tuple2<>(edge._2()._1(), edge._2()._2()));
            
            // Calculate the rank, without the bias term
            JavaPairRDD<String, Double> rankNoBias = messages.reduceByKey((v1, v2) -> v1 + v2);


            // Scale the biasless rank by 0.85, add the 0.15 bias
            newRank = rankNoBias.mapToPair(rank -> new Tuple2<>(rank._1(), rank._2() * 0.85 + 0.15));
            // Subtract the ranks from each other and find the largest absolute difference
            JavaPairRDD<String, Double> differences = newRank.join(previousRank).mapToPair(entry -> new Tuple2<>(entry._1(), Math.abs(entry._2()._2() - entry._2()._1())));
            maxDifference = differences.values().reduce((v1,v2) -> Math.max(v1, v2));
            previousRank = newRank;

        } while (maxDifference > this.d_max && iterations < this.i_max);
        // Sort by rank in descending order
        newRank = newRank.mapToPair(entry -> new Tuple2<>(entry._2(), entry._1())).sortByKey(false).mapToPair(entry -> new Tuple2<>(entry._2(), entry._1()));
        // Return the top 1000 entries
        return newRank.collect().subList(0, (int) Math.min(max_answers, newRank.count()));
    }
}
