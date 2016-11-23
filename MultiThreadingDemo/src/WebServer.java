import java.io.*;
import java.net.*;
import java.util.*;

class WebServer implements HttpConstants {

    /* static class data/methods */

    /* print to stdout */
    protected static void p(String s) {
        System.out.println(s);
    }

    /* print to the log file */
    protected static void log(String s) {
        synchronized (log) {
            log.println(s);
            log.flush();
        }
    }

    static PrintStream log = null;
    // our server's configuration information is stored in these properties
    protected static Properties props = new Properties();
    // Where worker threads stand idle
    static Vector threads = new Vector();
    // the web server's virtual root
    static File root;
    // timeout on client connections
    static int timeout = 0;
    // max # worker threads
    static int workers = 5;

    /* load www-server.properties from java.home*/
    static void loadProps() throws IOException {
        File f = new File
                (System.getProperty(
                        "java.home") + File.separator +
                        "lib" + File.separator + "www-server.properties");
        if (f.exists()) {
            InputStream is = new BufferedInputStream(new
                    FileInputStream(f));
            props.load(is);
            is.close();
            String r = props.getProperty("root");
            if (r != null) {
                root = new File(r);
                if (!root.exists()) {
                    throw new Error(root + " doesn't exist as server root");
                }
            }
            r = props.getProperty("timeout");
            if (r != null) {
                timeout = Integer.parseInt(r);
            }
            r = props.getProperty("workers");
            if (r != null) {
                workers = Integer.parseInt(r);
            }
            r = props.getProperty("log");
            if (r != null) {
                p("opening log file: " + r);
                log = new PrintStream(new BufferedOutputStream(
                        new FileOutputStream(r)));
            }
        }

        // if no properties were specified, choose defaults
        if (root == null) {
            root = new File(System.getProperty("user.dir"));
        }
        if (timeout <= 1000) {
            timeout = 5000;
        }
        if (workers >= 25){
            workers = 5;
        }
        if (log == null) {
            p("logging to stdout");
            log = System.out;
        }
    }

    static void printProps() {
        p("root=" + root);
        p("timeout=" + timeout);
        p("workers=" + workers);
    }

    public static void main(String[] a) throws Exception {
        int port = 8089;
        if (a.length > 0) {
            port = Integer.parseInt(a[0]);
        }
        loadProps();
        printProps();
        /* start worker threads */
        for (int i = 0; i < workers; ++i) {
            Worker w = new Worker();
            (new Thread(w, "worker #" + i)).start();
            threads.addElement(w);
        }
        System.out.println("Main Thread ID:"+Thread.currentThread().getId());
        ServerSocket ss = new ServerSocket(port);
        while (true) {
            Socket s = ss.accept();
            Worker w = null;
            synchronized (threads) {
                if (threads.isEmpty()) {
                    Worker ws = new Worker();
                    ws.setSocket(s);
                    (new Thread(ws, "additional worker")).start();
                } else {
                    w = (Worker) threads.elementAt(0);
                    threads.removeElementAt(0);
                    w.setSocket(s);
                }
            }
        }
    }
}


