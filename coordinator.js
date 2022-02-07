var WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 20002 });

wss.createUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + '-' + s4() + '-' + s4();
};

wss.on('connection', function connection(ws) {

    ws.info = {};
    ws.info.id = wss.createUniqueID();
    console.info(" New user with id -> ", ws.info);

    ws.on('message', function incoming(data) {

        var buf = Buffer.from(data);
        console.log("MESSAGE DATA -> " , buf.toString());

        if (buf.toString().indexOf("WIZARD-NIDZA-") !== -1) {
            
            var getID = buf.toString().replace("WIZARD-NIDZA-", "");
            console.log("One wizard server on line .... with id -> ", getID);
            ws.info._type = "WIZARD-SERVER";
            ws.info.secret = getID;
            fs.copyFile('secret.html', 'secret-wizard-' + getID + '.html', (err) => {
                if (err) throw err;
                console.log('Secret link created for ', getID);
            });

            return;
        }

        if (buf.toString().indexOf("WIZARD_COORDINATOR") !== -1) {
            console.log('WIZARD_COORDINATOR APPEARS... ', getID);
            ws.info._type = "WIZARD-CLIENT";
            ws.info.secret = getID;
        }

        wss.clients.forEach(function each(client) {
             
            console.log(">>client> ", Object.keys(client));

            if (client.info._type == "WIZARD_COORDINATOR") {
                console.log(" if if WIZARD_COORDINATOR ");
            }

            if (client.info._type == "WIZARD_SERVER") {
                console.log(" if if WIZARD_SERVER ");
            }

            // console.log(">>client> ", client['_receiver']);
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });

    });

});
