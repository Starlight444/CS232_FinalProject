# Prepare zip file to deploy in Lambda
Before make zip file please remove pycache file and old lambda_package folder
```
cd .\backend\
mkdir lambda_package
```
Install dependency from requirements.txt
```
docker run --rm -v ${PWD}:/var/task public.ecr.aws/sam/build-python3.11 pip install -r requirements.txt -t lambda_package 
```
Copy each folder into lambda_package folder
```
Copy-Item -Recurse handlers lambda_package\
Copy-Item -Recurse services lambda_package\
Copy-Item -Recurse repositories lambda_package\
Copy-Item -Recurse models lambda_package\
Copy-Item -Recurse storage lambda_package\
Copy-Item main.py lambda_package\
Copy-Item database.py lambda_package\
Copy-Item dependencies.py lambda_package\
Copy-Item config.py lambda_package\
```
Compress lambda_package folder into zip file
```
cd lambda_package
Compress-Archive -Path * -DestinationPath ../lambda.zip -Force
```
Open Lambda function and choose **upload zip file**