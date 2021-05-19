
<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#Features-and-functionality">Features and functionality</a></li>
    <li><a href="#API">The API</a></li>
    <li><a href="#UML">UML</a></li>
    <li><a href="#VIDEO">User stories video</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This web application project provides a friendly to use interface in which a user can upload a file he wishes
to train, and another csv file with possible anomalies. The uploaded data is processed by an anomaly detection
algorithm, and the answers that are sent back from the algorithm are presented to the user in a few
informative graphs and by spans that specify in which lines the anomalies occurred.
The entire project is written in JavaScript and is divided into 2 main sections:
1. The client side
2. A RESTful API handling the logic by interacting with a server that detects anomalies.


### Built With

* [node.js]()
* [react]()




<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/or-gottman/AnomalyDetectionWebApp
   ```
2. Install NPM packages
   ```sh
   npm install
   ```



<!-- Features-and-functionality -->
## Features and functionality

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

Firstly, the user uploads a csv file to be trained and also specifies which type of algorithm (hybrid/regression) needs to be used by the 
algorithm server. After the train file is uploaded the user is presented with a notice that a new model has been created, and the time of creation
is also specified. The user can then upload yet another file containing possible anomalies. The data is processed by the API and passed
to the algorithm server for anomaly detection. When the detection is done the algorithm server sends back a message that contains a list of spans for each 2 correlated features.
The spans are in the format of [start,end] where start is the first line and end is the line after the last line in which the anomalies were found. This list of lines
is passed to the client side to be presented to the user. Moreover, the information concerning the anomalies is presented graphically in the website....OR CONTINUE FROM HERE!!!!


_For more examples, please refer to the [Documentation](https://example.com)_

ADD PICTURES AND EXAMPLES HERE!!

<!-- API -->
## The API

* POST api/model  - 
* GET api/model
* DELETE api/model
* GET api/models
* POST api/anomaly


<!-- UML -->
## UML
 
add UML here!!


<!-- VIDEO -->
## User stories video

add here the video!!!


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/github_username
