
###################################

Node part of wizard remote control

##################################


Only for heroku:
```
npm install --save ws bufferutil utf-8-validate
```


Actions:
```
git push heroku main
heroku git:remote -a wizard-relay
```




Origin run
```js
  node relay.js supersecret 8081 8082
```