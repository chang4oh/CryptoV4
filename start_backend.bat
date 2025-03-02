@echo off 
cd C:\Users\PC\Documents\github\CryptoV4 
echo Starting CryptoV4 Backend... 
echo Installing required packages... 
python -m pip install requests python-dotenv pymongo pandas flask flask-cors textblob langchain huggingface_hub python-binance 
echo Required packages installed. 
python main.py 
pause 
