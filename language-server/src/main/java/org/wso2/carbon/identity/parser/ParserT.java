package org.wso2.carbon.identity.parser;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.Token;
import org.antlr.v4.runtime.tree.ParseTree;
import org.antlr.v4.runtime.tree.TerminalNodeImpl;
import javax.script.ScriptException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


public class ParserT {

    private static final Gson PRETTY_PRINT_GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Gson GSON = new Gson();


    public static String toJson(ParseTree tree, boolean prettyPrint) {
        return prettyPrint ? PRETTY_PRINT_GSON.toJson(toMap(tree)) : GSON.toJson(toMap(tree));
    }

    public static Map<String, Object> toMap(ParseTree tree) {
        Map<String, Object> map = new LinkedHashMap<>();
        traverse(tree, map);
        return map;
    }

    public static void traverse(ParseTree tree, Map<String, Object> map) {

        if (tree instanceof TerminalNodeImpl) {
            Token token = ((TerminalNodeImpl) tree).getSymbol();
            map.put("line", token.getLine());
            map.put("column", token.getCharPositionInLine());
            map.put("type",JavaScriptLexer.VOCABULARY.getSymbolicName(token.getType()));
            map.put("text", token.getText());
        }else {
            List<Map<String, Object>> children = new ArrayList<>();
            String name = tree.getClass().getSimpleName().replaceAll("Context$", "");
            map.put(Character.toLowerCase(name.charAt(0)) + name.substring(1), children);
            for (int i = 0; i < tree.getChildCount(); i++) {
                Map<String, Object> nested = new LinkedHashMap<>();
                children.add(nested);
                traverse(tree.getChild(i), nested);
            }
        }

    }

    public static String generateParseTree(String code) throws ScriptException {
        try{
            CharStream charStream = CharStreams.fromString(code);
            JavaScriptLexer javaScriptLexer =new JavaScriptLexer(charStream);
            CommonTokenStream commonTokenStream = new CommonTokenStream(javaScriptLexer);
            JavaScriptParser javaScriptParser = new JavaScriptParser(commonTokenStream);
            javaScriptParser.removeErrorListeners();
            javaScriptParser.addErrorListener(new JavaScriptErrorListner());
            ParseTree parseTree = javaScriptParser.program();
           return toJson(parseTree,true);

        }catch (Exception e){
           System.out.println(e);

        }

        return code;
    }
}
