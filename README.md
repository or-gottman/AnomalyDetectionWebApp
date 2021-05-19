**_Anomaly detection web application_**

###### About the app:

This web application project provides a friendly to use interface in which a user can upload a file he wishes
to train, and another csv file with possible anomalies. The uploaded data is processed by an anomaly detection 
algorithm, and the answers that are sent back from the algorithm are presented to the user in a few
informative graphs and by spans that specify in which lines the anomalies occurred.
The entire project is written in JavaScript and is divided into 2 main sections:
1. The client side - with the use of react. 
2. A RESTful API handling the logic by interacting with a server that detects anomalies.

###### The features found in the application:

The user first needs to upload a csv file to be trained and also specify the type of algorithm
(hybrid/regression) that should be used. After uploading the file, a notice appears specifying that
a new model has been created, and also the time of creation is presented. 
The user can then upload yet another csv file containing possible anomalies. The data is processed and after
the algorithm finishes the detection an answer is presented to the user in the form of spans.
Moreover, the information concerning the anomalies is presented graphically in the website and
thus the user can learn more of what has led to these anomalies. 
###TO BE CONTINUED BY OR - EXPLANATION ABOUT THE DIFFERENT GRAPHS!!!!!





