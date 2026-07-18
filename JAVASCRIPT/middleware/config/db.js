// const express = require("express");
import mongoose from "mongoose";
const ConnectDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/ecommerce");
    } catch (err) {
        console.log("connection error", err);
        process.exit(1);

    }
};
export default ConnectDB
//export connectdb