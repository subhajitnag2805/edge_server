var express = require('express');
const SerialPort = require('serialport-v4');
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require('body-parser');
var axios = require('axios');
var config = require('./config.json');

let id;
let port = new SerialPort('/dev/ttyACM0', {
    baudRate: 115200,
    parser: SerialPort.parsers.readline('\r\n')
});

// const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

/**
 * Import vitalStats model
*/
let vitalStats = require('./models/vitalStats');

/**
 * connect to mongodb
*/
// mongoose.connect('mongodb://127.0.0.1:27017/edge');
mongoose.connect('mongodb://test:password@ds211558.mlab.com:11558/ionic_chat');

//on successful connection
mongoose.connection.on('connected', () => {
    console.log('Connected to mongodb!!!');
});

//on error
mongoose.connection.on('error', (err) => {
    if (err) {
        console.log('Error in db is :' + err);
    }
});

//middleware
app.use(cors());
//body-parser
app.use(bodyParser.json());

io.on('connection', function (client) {
    console.log("Socket connected !");
    let status;
    client.on("start", function (data) {
        status = data.status;
        console.log("status :", status);
        /**
         * input : "temperature", from web
         * send : 6 , to arduino
         */
        if (status == "temperature") {
            let count = 0;
            port.update({
                baudRate: 115200
            }, function (data) {
                console.log("port updated to 115200");
            });
            let interval = setInterval(function () {
                count++;
                let buffer = new Buffer(1);
                buffer.writeInt8(6);
                port.write(buffer, function (error) {
                    if (error) {
                        console.log("Temperature error :", error);
                    } else {
                        console.log("Temperature :", buffer.toString('hex'));
                    }
                });
                console.log(count);
                if (count == 241) {
                    clearInterval(interval);
                }
            }, 1000);
        }
        /**
         * input : "glucometer", from web
         * send : 2 , to arduino
         */
        if (status == "glucometer") {
            port.update({
                baudRate: 115200
            }, function (data) {
                console.log("port updated to 115200");
            });
            let buffer = new Buffer(1);
            buffer.writeInt8(2);
            port.write(buffer, function (error) {
                if (error) {
                    console.log("glucometer error :", error);
                } else {
                    console.log("glucometer :", buffer.toString('hex'));
                }
            });
        }
        /**
         * input : "bp", from web
         * send : 3 , to arduino
         */
        if (status == "bp") {
            port.update({
                baudRate: 115200
            }, function (data) {
                console.log("port updated to 115200");
            });
            let buffer = new Buffer(1);
            buffer.writeInt8(3);
            port.write(buffer, function (error) {
                if (error) {
                    console.log("bp error :", error);
                } else {
                    console.log("bp :", buffer.toString('hex'));
                    if (buffer.toString('hex')) {
                        port.update({
                            baudRate: 19200
                        }, function (data) {
                            console.log("port updated to 19200");
                        });
                    }
                }
            });
        }
        /**
         * input : "spo2", from web
         * send : 4 , to arduino
         */
        if (status == "spo2") {
            port.update({
                baudRate: 115200
            }, function (data) {
                console.log("port updated to 115200");
            });
            let buffer = new Buffer(1);
            buffer.writeInt8(4);
            port.write(buffer, function (error) {
                if (error) {
                    console.log("spo2 error :", error);
                } else {
                    console.log("spo2 :", buffer.toString('hex'));
                }
            });
        }
        /**
         * input : "gsr", from web
         * send : 5 , to arduino
         */
        if (status == "gsr") {
            port.update({
                baudRate: 115200
            }, function (data) {
                console.log("port updated to 115200");
            });
            let buffer = new Buffer(1);
            buffer.writeInt8(9);
            port.write(buffer, function (error) {
                if (error) {
                    console.log("gsr error :", error);
                } else {
                    console.log("gsr :", buffer.toString('hex'));
                }
            });
        }
        /**
         * input : "spirometer", from web
         * send : 7 , to arduino
         */
        if (status == "spirometer") {
            port.update({
                baudRate: 115200
            }, function (data) {
                console.log("port updated to 115200");
            });
            let buffer = new Buffer(1);
            buffer.writeInt8(7);
            port.write(buffer, function (error) {
                if (error) {
                    console.log("gsr error :", error);
                } else {
                    console.log("gsr :", buffer.toString('hex'));
                    if (buffer.toString('hex')) {
                        port.update({
                            baudRate: 9600
                        }, function (data) {
                            console.log("port updated to 9600");
                        });
                    }
                }
            });
        }
    });
    port.on('data', function (data) {
        console.log("arduino data :", data);
        client.emit('value',
            { "value": data, "status": status });
    });
});

/**
 * Routings
 */

/**
 * User registration and login
 *
 * id:String
 * name:String
 * email:String
 * loginTime:String
 * 
 */
app.post('/registration', function (request, response) {
    console.log("User data :");
    console.log(request.body);

    let userDetails = {};
    let name = request.body.name;
    let email = request.body.email;
    let individualId = request.body.individualId;

    if (individualId) {
        id = individualId;
    }

    let data = new vitalStats();
    data.name = name;
    data.email = email;
    data.individualId = individualId;

    data.save(function (error, result) {
        if (error) {
            userDetails.error = true;
            userDetails.message = `User details not saved.`;
            response.status(404).json(userDetails);
        } else if (result) {
            userDetails.error = false;
            userDetails.userRegistration = result;
            userDetails.message = `User Registration Details.`;
            response.status(200).json(userDetails);
        }
    });
});

/**
 *
 * Save sensor values
 * time:String
 * temperature:String
 * "gsr":{
 *  "conductance":"",
 *  "resistance":"",
 *  "conductanceVol":""
 * }
 */
app.put('/sensorValues', function (request, response) {
    console.log("request.body :");
    console.log(request.body);

    let details = {};

    /**For measuring temperature*/
    let temperature = request.body.temperature;

    /**For measuring glucometer */
    let glucometer = request.body.glucometer;

    /**For measuring bp */
    let bp = request.body.bp;

    /**For measuring ECG */
    let spo2 = request.body.spo2;

    /**For measuring GSR*/
    let gsr = request.body.gsr;

    /**For measuring spirometer*/
    let spirometer = request.body.spirometer;

    /**calling rest api for meme server
     * post operation
    */

    //header
    let axiosConfig = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    vitalStats.findOne({ _id: request.body._id }, function (error, res) {
        if (error) {
            details.error = true;
            details.message = `User not found.`;
            response.status(404).json(details);
        } else if (res) {
            /**temperature
             * post data to local database
             * post data to meme server
             */
            if (temperature) {
                //post temperature data to local database
                res.stats.push({
                    "temperature": temperature
                });

                //post data to memeserver
                axios.post(config.apiUrl + 'vital/create', {
                    "individualId": id,
                    "statType": "temperature",
                    "statValue": temperature
                }, axiosConfig)
                    .then(function (result) {
                        console.log("result :", result.data);
                    }).catch(function (error) {
                        console.log("error :", error);
                    });
            }

            if (glucometer) {
                res.stats.push({
                    "glucometer": glucometer
                });

                //post data to memeserver
                axios.put(config.apiUrl + 'vital/create', {
                    "individualId": id,
                    "statType": "glucometer",
                    "statValue": glucometer
                }, axiosConfig)
                    .then(function (result) {
                        console.log("result :", result.data);
                    }).catch(function (error) {
                        console.log("error :", error);
                    });
            }

            if (bp) {
                res.stats.push({
                    "bp": bp
                });

                //update data to memeserver
                axios.put(config.apiUrl + 'vital/create', {
                    "individualId": id,
                    "statType": "bp",
                    "statValue": bp
                }, axiosConfig)
                    .then(function (result) {
                        console.log("result :", result.data);
                    }).catch(function (error) {
                        console.log("error :", error);
                    });
            }

            if (spo2) {
                res.stats.push({
                    "spo2": spo2
                });

                //update data to memeserver
                axios.put(config.apiUrl + 'vital/update', {
                    "_id": id,
                    "stats": {
                        "spo2": spo2
                    }
                }, axiosConfig)
                    .then(function (result) {
                        console.log("result :", result.data);
                    }).catch(function (error) {
                        console.log("error :", error);
                    });
            }

            if (gsr) {
                res.stats.push({
                    "gsr": gsr
                });

                //update data to memeserver
                axios.put(config.apiUrl + 'vital/create', {
                    "individualId": id,
                    "statType": "gsr",
                    "statValue": gsr
                }, axiosConfig)
                    .then(function (result) {
                        console.log("result :", result.data);
                    }).catch(function (error) {
                        console.log("error :", error);
                    });
            }

            if (spirometer) {
                res.stats.push({
                    "spirometer": spirometer
                });

                //update data to memeserver
                axios.put(config.apiUrl + 'vital/update', {
                    "_id": id,
                    "stats": {
                        "spirometer": spirometer
                    }
                }, axiosConfig)
                    .then(function (result) {
                        console.log("result :", result.data);
                    }).catch(function (error) {
                        console.log("error :", error);
                    });
            }
            res.save(function (error, result) {
                if (error) {
                    details.error = true;
                    details.message = `Sensor details not saved.`;
                    response.status(404).json(details);
                } else if (result) {
                    details.error = false;
                    details.sensorDetails = result;
                    details.message = `Sensor Details.`;
                    response.status(200).json(details);
                }
            });
        }
    });
});

const PORT = 8000;
server.listen(PORT, function () {
    console.log("Server started");
});