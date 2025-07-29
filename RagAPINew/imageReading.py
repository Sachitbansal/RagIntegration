import os
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure your API key
# Get the API key from environment variables
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables or .env file.")

genai.configure(api_key=GEMINI_API_KEY)

def analyze_image_with_context(image_path, text_context):
    """
    Sends an image to the Gemini Flash model with accompanying text context
    and prints the model's response.

    Args:
        image_path (str): The path to the image file.
        text_context (str): The text prompt/context for the image.
    """
    try:
        # Load the image using Pillow
        img = Image.open(image_path)

        # Select the Gemini Flash model
        # You can use "gemini-1.5-flash" or "gemini-1.5-flash-001" or "gemini-pro-vision"
        # "gemini-1.5-flash" or "gemini-1.5-flash-001" are generally recommended
        # for multimodal tasks.
        model = genai.GenerativeModel('gemini-2.0-flash')

        # Create the content list for the model.
        # It's a list of parts, where each part can be text or an image.
        contents = [
            text_context,
            img
        ]

        # Generate content from the model
        print(f"Sending request to Gemini Flash model...")
        response = model.generate_content(contents)

        # Print the response
        print("\nGemini Flash Model Response:")
        print(response.text)

    except FileNotFoundError:
        print(f"Error: Image file not found at '{image_path}'")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Replace with the actual path to your image file
    image_file = "RagAPINew/download.jpeg" # Example: "my_vacation_photo.png"

    # The text context you want to send along with the image
    context_prompt = "What do you see in this image? Describe the main subject and its surroundings. Also, based on the image, what kind of weather is it?"
    
    # --- Run the analysis ---
    analyze_image_with_context(image_file, context_prompt)

    print("\n--- Example with a different context ---")
    # image_file_2 = "RagAPINew/download2.jpeg" # Another example image
    # context_prompt_2 = "Identify any text present in this image and transcribe it. If there are objects, list them."
    # Make sure this image file exists, or comment out this section
    # analyze_image_with_context(image_file_2, context_prompt_2)
    