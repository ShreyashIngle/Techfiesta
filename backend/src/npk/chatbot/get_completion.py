import openai
def get_completion(prompt, engine="GPT4OAISpeaking"):
    messages = [{"role": "user", "content": prompt}]
    response = openai.ChatCompletion.create(
        engine=engine,
        messages=messages,
        temperature=0.0
    )
    content = response.choices[0].message["content"]
    token_dict = {
        'prompt_tokens': response['usage']['prompt_tokens'],
        'completion_tokens': response['usage']['completion_tokens'],
        'total_tokens': response['usage']['total_tokens'],
    }
    print(f"Prompt Cost : {token_dict}")
    return content