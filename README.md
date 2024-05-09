## Names & group number
Group 18, Java Swingers
- Seth Sukboontip: sethsuk@seas.upenn.edu
- Sam Wang: swang27@seas.upenn.edu
- Zimo Huang: zimoh@sas.upenn.edu
- Sonia Tam: sotam@sas.upenn.edu


## Description of features implemented
InstaLite is a social media platform built to emulate Instagram. The platform includes a host of features such as creating user profiles, associating users with actors based on matching images, posting and interacting with image content, chatting with friends, and searching for posts and profiles


## Extra Credit Claimed
- LinkedIn-style friend requests, with accept and reject
    In the Friends tab, users can receive friend request invitations and choose to either accept or reject them. If accepted, the friends table will be updated, as well as the status in the friend_requests table
- Infinite scrolling on the Feed 
    We use the React infinite scroll component to support infinite scrolling so that the server fetches more posts on the user’s demand. 
- WebSockets for chat
    We use socket io to implement chat. This makes the speed of chatting very fast and efficient and also makes sure that there is temporal consistency in the message display for different chat end users
- Returning valid links to posts for Search 
    We directly display posts that the user is looking for (like in Feed) along with GPT’s response in search results. We also enable users to directly like and view comments by clicking on the post.

## List of source files included
Reference Attached Repository

## Declaration
We declare that all code in this project was written by us and not copied from the internet or any other source nor group.


## Instructions for building and running this project
- Clone the repository
- Start AWS instance and relevant databases
- Run “npm install” from the server folder
- Run “npm install” from the frontend folder
- Create .env file and input the corresponding information
    export AWS_ACCESS_KEY_ID=[access key]
    export AWS_SECRET_ACCESS_KEY=[secret key]
    export AUTH_TOKEN=[auth token]
    export RDS_USER=[admin]
    export RDS_PWD=[rds-password]
    export USE_PERSISTENCE=TRUE
- Run “source .env” in terminal
- Create a tunnel to the RDS table
- In a new tab, initialize the ChromaDB with “chroma run --host 0.0.0.0”
- In a new tab, follow the setup instructions from the nets2120’s “basic-kafka-client” repository
- In a new tab, start the frontend server with “npm run dev --host” within the frontend folder
- In a new tab, start the backend server with “npm start” within the server folder


