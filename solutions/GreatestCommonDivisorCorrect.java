import java.util.*;
import java.io.*;

public class GreatestCommonDivisorCorrect{
	public static boolean DEBUG = true;
	
	public static void main(String[] args) throws Exception{
		BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
		PrintWriter pw = new PrintWriter(System.out);
		
		StringTokenizer st = getst(br);
		int a = nextInt(st);
		int b = nextInt(st);
		
		pw.println(euclid(a, b));
		
		br.close();
		pw.close();
	}
	
	public static int euclid(int a, int b){
		while(b != 0){
			int r = a % b;
			a = b;
			b = r;
		}
		return a;
	}
	
	public static void debug(Object o){
		if(DEBUG){
			System.out.println("~" + o);
		}
	}
	
	public static StringTokenizer getst(BufferedReader br) throws Exception{
		return new StringTokenizer(br.readLine(), " ");
	}
	
	public static int nextInt(BufferedReader br) throws Exception{
		return Integer.parseInt(br.readLine());
	}
	
	public static int nextInt(StringTokenizer st) throws Exception{
		return Integer.parseInt(st.nextToken());
	}
}