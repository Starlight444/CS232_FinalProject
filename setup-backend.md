# Setup backend in your computer
Install python version 3.11 via
https://www.python.org/downloads/release/python-3119/

Check python version in terminal
```
python --version 
# or
python -c "import sys; print(sys.executable)”
```

Create python environment and activate
```
cd backend
python -m venv venv
.\venv\Scripts\activate
```

If error about **security** occur, run this command
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Install python dependency
```
pip install -r requirements.txt
```

Run server
```
python -m uvicorn app.main:app --reload
```

Open Swagger from FastAPI
```
http://127.0.0.1:8000/docs
```

Deactivate environment
```
deactivate
```

Before working next time just run 
```
cd backend
.\venv\Scripts\activate
```