const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan("tiny"));

app.get("/", (req, res, next) => {
  res.send("Response from Express server");
});

app.listen(PORT, () => console.log(`Server is listening at PORT ${PORT}`));
