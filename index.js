const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 4000;
const connectDB = require("./config/DB_config");
const express = require("express");
const booksRouter = require("./Router/books.routes");
const error_middleware = require("./Middlewares/error_middleware");
const authorsRouter = require("./Router/author.routes");
const AuthRouter = require("./Router/auth.routes");
const fileUploadRouter = require("./Router/file.upload.routes");
const path = require("path");
const cookie_parser = require("cookie-parser")
const CommentsRouter = require("./Router/comments.routes");
const membersRouter = require("./Router/members.routes")
const LogsRouter = require("./Router/logs.routes")
const logger = require("./service/logger");
const { stringify } = require("querystring");
const app = express();
connectDB();
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
      try {
          const duration = Date.now() - start;
          const logData = ({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            requestBody: req.body,
            responseHeaders: res.getHeaders(),
          });
          logger.info(JSON.stringify(logData, null, 4))
      } catch (error) {
          console.error('Log yozishda xatolik:', error);
      }
  });
  next();
});
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const swaggerUi = require("swagger-ui-express");
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./docs/swagger.yaml')
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/', (req, res) => {
  res.send('API ishlayapti!');
});
const serverUrl = 'https://library-project-6agw.onrender.com';
swaggerDocument.servers = [
  { url: serverUrl, description: 'Current Server' }
];
app.use(cookie_parser())
app.use(booksRouter);
app.use(authorsRouter);
app.use(AuthRouter);
app.use(LogsRouter)
app.use(fileUploadRouter);
app.use(CommentsRouter);
app.use(membersRouter)
app.use(error_middleware);
app.listen(PORT, () => {
  console.log("server is running on the port: " + PORT);
});
