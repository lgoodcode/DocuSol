import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your environment variables
});

export async function POST(req: NextRequest) {
  try {
    const { type, documentName, goal } = await req.json();

    // Construct prompt based on the type of request
    let prompt = "";
    if (type === "document") {
      prompt = `Generate a structured document named "${documentName}" with the goal: "${goal}". Only respond with the document content. You will create a sample document following the goal given by the user. Do not identify yourself.`;
    } else if (type === "chat") {
      prompt = goal; // For chat, directly use the goal as the prompt
    } else if (type === "agent") {
      prompt = `Act as an AI assistant to help with: ${goal}`;
    }

    // Make the OpenAI API call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Adjust model as needed
      messages: [{role: "system", content: "You are a helpful assistant to create documents and contracts for people. Do not include any assistant commentary in your response. Do not use any markup in your response." }, { role: "user", content: prompt }],
      store: true,
    });

    // Extract the response message from OpenAI
    const responseMessage = completion.choices[0]?.message?.content || "No response received.";

    return NextResponse.json({
      success: true,
      data: {
        message: responseMessage,
      },
    });
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
