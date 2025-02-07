In order to use this app, you will need to create an account with ngrok and Agora.io

On Agora.io click on Create Project
![image](https://github.com/user-attachments/assets/9cf52f10-2ced-4f66-91e5-a2a490698295)
Then select Configure on your new project

Change the Name of the Project and Enable Primary certificate
![image](https://github.com/user-attachments/assets/5490a0f4-6f88-4047-b919-2bb5dbeb8bf2)

You will then need to generate a RTC token for web calls
![image](https://github.com/user-attachments/assets/46796f50-f5cb-4bdf-b24f-a531ba04545c)

To genereate a token, click on the link and add a channel name (Doesnt matter what it is) and click generate token
Then copy over the app id, channel name, and token to the main.js file

After setting up Agora, sign up for Ngrok and unzip the .exe file and place it into your main directory
To enable Ngrok, run "./ngrok http 5500" this will run a secure (https) server on port 5500 so other devices can connect to your network

To Run the python server run this code "python -m http.server 5500"

with both of these servers running you should be able to connect using your ngrok port
