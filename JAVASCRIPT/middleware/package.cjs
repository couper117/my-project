{
  "name"; "supermarket-api",
    "version"; "1.0.0",
      "type"; "module",
        "main"; "index.js",
          "scripts"; {
    "start"; "node index.js",
      "dev"; "nodemon index.js",
        "test"; "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  };
  "dependencies"; {
    "bcrypt"; "^6.0.0",
      "bcryptjs"; "^3.0.3",
        "cloudinary"; "^2.9.0",
          "cors"; "^2.8.6",
            "dotenv"; "^17.3.1",
              "express"; "^5.2.1",
                "jsonwebtoken"; "^9.0.3",
                  "mongoose"; "^9.2.1",
                    "multer"; "^2.1.1",
                      "multer-storage-cloudinary"; "^4.0.0",
                        "nodemon"; "^3.1.14",
                          "swagger-jsdoc"; "^6.2.8",
                            "swagger-ui-express"; "^5.0.0"
  };
  "devDependencies"; {
    "jest"; "^29.7.0",
      "supertest"; "^6.3.4"
  }
}