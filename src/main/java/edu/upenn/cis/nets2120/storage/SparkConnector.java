package edu.upenn.cis.nets2120.storage;

import java.io.File;

import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;

public class SparkConnector {
    static SparkSession spark = null;
    static JavaSparkContext context = null;

    public static SparkSession getSparkConnection() {
        return getSparkConnection(null);
    }

    public static synchronized SparkSession getSparkConnection(String host) {
        if (spark == null) {
            if (System.getenv("HADOOP_HOME") == null) {
                File workaround = new File(".");

                System.setProperty("hadoop.home.dir", workaround.getAbsolutePath() + "/native-libs");
            }

            if (host != null && !host.startsWith("spark://"))
                host = "spark://" + host + ":7077";

            if (Config.ACCESS_KEY_ID != null) {
                spark = SparkSession
                        .builder()
                        .appName("Homework3")
                        .master((host == null) ? Config.LOCAL_SPARK : host)
                        .config("spark.hadoop.fs.s3a.access.key", Config.ACCESS_KEY_ID)
                        .config("spark.hadoop.fs.s3a.secret.key", Config.SECRET_ACCESS_KEY)
                        .config("spark.hadoop.fs.s3a.session.token", Config.SESSION_TOKEN)
                        .config("spark.hadoop.fs.s3a.endpoint", "s3.us-east-1.amazonaws.com")
                        .getOrCreate();
            } else {
                spark = SparkSession
                        .builder()
                        .appName("Homework3")
                        .master((host == null) ? Config.LOCAL_SPARK : host)
                        .getOrCreate();
            }
        }

        return spark;
    }

    public static synchronized JavaSparkContext getSparkContext() {
        if (context == null)
            context = new JavaSparkContext(getSparkConnection().sparkContext());

        return context;
    }
}
