from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_google_genai import GoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv
app = Flask(__name__)
CORS(app)
load_dotenv() 
# Memory storage — key = conversation ID
memory_store = {}


prompt = PromptTemplate(
    input_variables=["history", "input"],
    template="""
            You are a helpful and knowledgeable assistant. 
            Maintain a friendly tone.

            Conversation history:
            {history}

            User: {input}

            Assistant:
            """
)

def get_chain(conversation_id):
    if conversation_id not in memory_store:
        memory_store[conversation_id] = ConversationBufferWindowMemory(
            memory_key="history",  # This must match your prompt if custom used
            k=6,                        # Limit to last 6 exchanges (3 user + 3 AI)
            return_messages=True
        )
    return ConversationChain(
        llm=GoogleGenerativeAI(model="gemini-2.5-flash"),
        memory=memory_store[conversation_id],
        prompt=prompt,
        verbose=False
    )

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get("message")
    conversation_id = data.get("conversationId")

    if not user_input or not conversation_id:
        return jsonify({"error": "Missing input or conversation ID"}), 400

    chain = get_chain(conversation_id)
    response = chain.predict(input=user_input)
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(port=5000)
