const express = require("express");
require("dotenv").config();
const cors = require("cors");
const conndb = require("../middlewire/conndb");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Course = require("../models/Course");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const instance = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_key_id,
  key_secret: process.env.key_secret,
});
const nodemailer = require("nodemailer");
let otpStore = {};

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.status(200).json({ name: "Hello Skillearner" });
});
app.post("/signup", async (req, res) => {
  try {
    await conndb();
    let email = req.body.email;
    let passwordold = req.body.password;
    let name = req.body.name;
    let phone = req.body.phone;
    let otp = req.body.otp;
    const password = await bcrypt.hash(passwordold, 10);
    if (otpStore[email] === otp) {
      let user = new User({ email, phone, password, name });
      let u = await user.save();
      res.status(200).json({ success: true, data: u._id });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.json({ success: false });
  }
});

app.post("/login", async (req, res) => {
  await conndb();
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    //console.log(user);
    if (user.length == 0) {
      return res.status(401).res.json({ success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false });
    }
    var token = jwt.sign(
      { email: user.email, name: user.name, id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ success: true, accessToken: token });
  } catch (error) {
    //console.error(error);
    return res.status(500).json({ success: false });
  }
});
app.post("/forgotpassword", async (req, res) => {
  await conndb();
  const { email } = req.body;
  // console.log(email);

  try {
    const user = await User.findOne({ email });
    //console.log(user._id.toString());

    if (!user) {
      return res
        .status(400)
        .json({ message: "No user found with that email address" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // console.log(token);
    // Set token and expiration time on the user object
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    // console.log(user);

    await user.save();

    // Generate reset link
    const resetLink = `http://localhost:5173/reserpassword?token=${token}`;

    res.status(200).json({ resetLink });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/resetpassword", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log(user);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }

    // Update the user's password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.post("/validatesession", (req, res) => {
  let token = req.body.token;
  //console.log(token);
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    //console.log("sedhj", decoded);
    if (decoded) {
      res.json({ status: true, data: decoded });
    }
  } catch (err) {
    res.json({ status: false });
  }
});

app.post("/getuserbyid", async (req, res) => {
  try {
    await conndb();
    const u1 = await User.findById(req.body.id);
    res.status(201).json({ status: true, data: u1 });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: false, error: "error occured" });
  }
});

app.post("/uploadcourses", async (req, res) => {
  try {
    await conndb();

    try {
      const c = new Course(req.body);
      const c1 = await c.save();
      res.status(201).json({ status: true, data: c1 });
    } catch (error) {
      res.status(404).json({ status: false, error: "error occured" });
    }
  } catch (err) {
    res.status(500).json({ status: false, error: "error occured" });
  }
});
app.get("/getallcourses", async (req, res) => {
  try {
    await conndb();

    try {
      const c1 = await Course.find();
      res.status(201).json({ status: true, data: c1 });
    } catch (error) {
      res.status(404).json({ status: false, error: "error occured" });
    }
  } catch (err) {
    res.status(500).json({ status: false, error: "error occured" });
  }
});
app.post("/getcoursebyid", async (req, res) => {
  try {
    await conndb();
    const c1 = await Course.findById(req.body.id);
    res.status(201).json({ status: true, data: c1 });
  } catch (err) {
    //console.log(err);
    res.status(500).json({ status: false, error: "error occured" });
  }
});

app.post("/updateuserbyid", async (req, res) => {
  try {
    await conndb();
    let cid = req.body.cid;
    let userid = req.body.userid;
    let coursedata = await Course.findById(cid);
    //console.log(coursedata);

    let updateduser = await User.findByIdAndUpdate(userid, {
      enrolledcourses: coursedata,
    });
    //console.log(updateduser);
    if (updateduser) {
      res.status(201).json({ status: true, data: updateduser });
    } else {
      throw new Error();
    }
  } catch (err) {
    //console.log(err);
    res.status(500).json({ status: false, error: "error occured" });
  }
});

app.post("/veryfypurchasebyuser", async (req, res) => {
  try {
    await conndb();
    let id = req.body.id;
    //console.log(id);
    let cid = req.body.cid;
    //console.log(cid);
    let purchasedcourse = await User.findById(id);
    //console.log(purchasedcourse);
    //console.log(purchasedcourse);

    if (purchasedcourse) {
      let course = purchasedcourse.enrolledcourses;
      //console.log(course);
      if (course.length > 0) {
        for (let i = 0; i < course.length; i++) {
          if (course[i]._id.toString() === cid) {
            res.status(201).json({ status: true, data: course[i] });
          }
        }
      } else {
        res.status(201).json({ status: false, error: "error occured" });
      }
    } else {
      res.status(400).json({ status: false, error: "error occured" });
    }
  } catch (error) {
    //console.log(error);
    res.status(500).json({ status: false, error: "error occured" });
  }
});

app.post("/prepayment", async (req, res) => {
  //console.log(instance.orders);
  const { amount, name, email, cid } = req.body;
  //console.log(cid);
  const coursedata = await Course.findById(cid);

  const order = await instance.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt#1",
    notes: {
      name: name,
      email: email,
    },
  });
  const norder = new Order({
    oid: order.id,
    cid: cid,
    amount,
    email,
    course: coursedata,
  });
  const noro = await norder.save();

  res.status(201).json({
    status: true,
    data: order,
    course: coursedata,
    key: process.env.NEXT_PUBLIC_key_id,
  });
});
app.post("/postpayment", async (req, res) => {
  //console.log(req.body);
  const { order_id, payment_id, signature } = req.body;
  //console.log({ payment_id, order_id, signature });
  const body = order_id + "|" + payment_id;
  const expectedsigneture = crypto
    .createHmac("sha256", process.env.key_secret)
    .update(body.toString())
    .digest("hex");
  //console.log(expectedsigneture, "\n", signature);
  const auth = expectedsigneture === signature;
  //console.log(auth);
  if (auth) {
    //console.log(auth);
    let order = await Order.findOneAndUpdate(
      { oid: order_id },
      { paystatus: "paid" }
    );
    let nuserdata = await User.findOneAndUpdate(
      { email: order.email },
      { $push: { enrolledcourses: order.course } }
    );

    res.json({ success: true });
  } else {
    res.json({ success: true });
  }
});

app.post("/sendotp", async (req, res) => {
  //const { email,name } = req.body;

  //   const transporter = nodemailer.createTransport({
  //     host: 'smtp.ethereal.email',
  //     port: 587,
  //     auth: {
  //         user: 'haley.grant0@ethereal.email',
  //         pass: '51EQmeJfJq9exNj7jf'
  //     }
  // });
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.NODEMAILERPASS,
    },
  });

  const { email, name } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;
  try {
    const info = await transporter.sendMail({
      from: "debangan7699550670@gmail.com", // sender address
      to: email, // list of receivers
      subject: "Verification Email", // Subject line
      html: `
      <html>
      <head>
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f6f6f6;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #dddddd;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333333;
          }
          .content {
            padding: 20px;
          }
          .content p {
            font-size: 16px;
            line-height: 1.5;
            color: #555555;
          }
          .otp {
            display: block;
            width: fit-content;
            margin: 20px auto;
            padding: 10px 20px;
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            background-color: #4CAF50;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            border-top: 1px solid #dddddd;
            font-size: 14px;
            color: #999999;
          }
          .footer a {
            color: #4CAF50;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>Thank you for registering with Skill Earner. Please use the following One-Time Password (OTP) to verify your email address and complete your registration:</p>
            <div class="otp">${otp}</div>
            <p>This OTP is valid for the next 10 minutes. If you did not request this OTP, please ignore this email.</p>
            <p>Best regards,<br>The Skill Earner Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Skill Earner. All rights reserved.</p>
            <p><a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>`,
    });
    //console.log("Message sent: ", info);
    res.status(201).json({ success: true, info: info });
  } catch (error) {
    //console.log(error);
    re.json({ success: false });
  }

  // res.json({ success: true });
});

app.listen(port, () => {
  console.log(`app running on port ${port}\nvisit http://localhost:${port}`);
});
