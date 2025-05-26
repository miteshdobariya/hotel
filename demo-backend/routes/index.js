var express = require('express');
var router = express.Router();
const user = require("../models/user")
const booking = require("../models/booking")
const roominsert = require("../models/roominsert")
const bcrypt = require('bcrypt');
const multer = require('multer');
const Joi = require('joi')
const validator = require('express-joi-validation').createValidator({})
var nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const querySchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().min(2).max(7).required()
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


// roominsert start

router.post('/addroom', upload.single('image'), async function (req, res, next) {
  try {
    console.log(req.body);
    console.log(req.file);

    var obj = {
      name: req.body.name,
      detail: req.body.detail,
      image: req.file.originalname
    }

    await roominsert.create(obj);
    res.status(200).json({
      status: "done",
    })
  }
  catch (err) {
    res.status(400).json({
      status: "err"
    })
  }
});








router.post('/check-booking/:id', async (req, res) => {
  try {
    const { checkin, checkout } = req.body;

    // Validate input
    if (!checkin || !checkout) {
      return res.status(400).json({ status: "error", message: "Check-in and check-out dates are required" });
    }

    if (new Date(checkin) >= new Date(checkout)) {
      return res.status(400).json({ status: "error", message: "Check-out date must be after check-in date" });
    }

    // Check for booking conflicts
    const conflictingBookings = await booking.find({
      room_id: req.params.id,
      $and: [
        { checkin: { $lt: checkout }, checkout: { $gt: checkin } },
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({ status: "error", message: "Room is already booked for the selected dates" });
    }

    // No conflicts found
    res.status(200).json({ status: "available", message: "Room is available for booking" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to check booking availability" });
  }
});



router.post('/booking/:id', async (req, res) => {
  try {
    const { checkin, checkout, email, roomname } = req.body;

    // Find the user by email
    const detail = await user.findOne({ "email": email });
    console.log(detail);
    if (!detail) {
      return res.status(400).json({ status: "error", message: "User does not exist" });
    }

    if (!checkin || !checkout) {
      return res.status(400).json({ status: "error", message: "Check-in and check-out dates are required" });
    }

    if (new Date(checkin) >= new Date(checkout)) {
      return res.status(400).json({ status: "error", message: "Check-out date must be after check-in date" });
    }

    // Check for booking conflicts
    const conflictingBookings = await booking.find({
      room_id: req.params.id,
      $or: [
        { checkin: { $lt: checkout }, checkout: { $gt: checkin } },
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({ status: "error", message: "Room is already booked for the selected dates" });
    }

    // Create new booking if no conflicts
    const newBooking = await booking.create({
      room_id: req.params.id,
      roomname,
      email,
      checkin,
      checkout,
    });

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'miteshdobariya2206@gmail.com',
        pass: 'tfqb odaj cnpk bgbm '
      }
    });

    const mailOptions = {
      from: 'miteshdobariya2206@gmail.com',
      to: detail.email,
      subject: 'Room Booking Confirmation',
      text: `Dear ${detail.username},\n\nYour booking for room ${roomname} has been successfully confirmed.\n\nBooking details:\nCheck-in Date: ${checkin}\nCheck-out Date: ${checkout}\n\nThank you for booking with us!\n\nBest regards,\nYour Hotel Team.`
    };

    // Send email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ status: "done", data: newBooking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Failed to create booking" });
  }
});





// Endpoint to check room booking details with room info
const mongoose = require('mongoose');

router.get('/bookingcheck/:id', async (req, res) => {
  try {
    // Convert the room_id to ObjectId if necessary
    const roomId = new mongoose.Types.ObjectId(req.params.id);

    const roomBookings = await booking.aggregate([
      {
        $match: { "room_id": roomId }
      },
      {
        $lookup: {
          from: "registrations", // Confirm the exact name of the collection storing room data
          localField: "email",
          foreignField: "email",
          as: "roomDetails"
        }

      },
      {
        $unwind: { path: "$roomDetails", preserveNullAndEmptyArrays: true }, // Unwind the roomDetails array to get individual objects
      },

    ]);


    if (roomBookings.length === 0) {
      return res.status(404).json({ status: "error", message: "No bookings found for this room" });
    }
    console.log("**************");
    console.log(roomBookings);
    res.status(200).json({ status: "done", data: roomBookings });
  } catch (err) {
    console.error("Error in /bookingcheck/:id:", err.message); // Better error logging
    res.status(500).json({ status: "error", message: "Failed to retrieve booking details", error: err.message });
  }
});







// room booking end


// room get start

router.get('/getroom', async function (req, res, next) {
  try {

    var data = await roominsert.find();

    res.status(200).json({
      status: "done",
      data
    })
  }
  catch (err) {
    res.status(400).json({
      status: "err"
    })
  }
});

// room get end


// room detail page get start

router.get('/getroomdetail/:id', async function (req, res, next) {
  try {

    var data = await roominsert.findById(req.params.id);
    console.log(data);
    console.log("----------data---------")


    res.status(200).json({
      status: "done",
      data
    })
  }
  catch (err) {
    res.status(400).json({
      status: "err"
    })
  }
});


// room detail page get end


// ----------------------------------------------------------------------


router.post('/add', validator.body(querySchema), async function (req, res, next) {
  try {
    console.log(req.body.username);
    var crypt = await bcrypt.hash(req.body.password, 10)
    console.log(req.body);
    var obj = {
      username: req.body.username,
      email: req.body.email,
      password: crypt,
    }
    await user.create(obj);
    res.status(200).json({
      status: "done"
    })
  }
  catch (err) {
    res.status(400).json({
      status: "err"
    })
  }
});

const JWT_SECRET1 = process.env.JWT_SECRET;

router.post('/verify', async function (req, res, next) {
  try {

    var name = req.body.username;
    console.log(name);
    console.log("JWT_SECRET1:", JWT_SECRET1);
    // var data = await user.find({"username":"name"})

    var data = await user.findOne({ "username": name });
    console.log(data)

    if (data != null) {
      var encrypt = await bcrypt.compare(req.body.password, data.password)
      if (encrypt != false) {
        // console.log("---------------")

        const token = jwt.sign(
          { username: name, id: data._id },
          JWT_SECRET1,
          { expiresIn: '1m' },
        )
        console.log("Generated Token:", token);
        res.status(200).json({
          status: "done",
          data,
        token:token,
        })
      }
      else {
        res.status(400).json({
          status: "password",
          message: "invalid password"
        })
      }
    }

    else {
      res.status(400).json({
        status: "username",
        message: "invalid username",

      })
    }


  }
  catch (err) {
    res.status(400).json({
      status: "err",
    })
  }
});




router.post('/forgot', async function (req, res, next) {
  try {
    data = await user.findOne({ "email": req.body.email });
    console.log(data);

    id = data._id;
    var transporter = await nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'miteshdobariya2206@gmail.com',
        pass: 'tfqb odaj cnpk bgbm '
      }
    });

    otp = Math.floor((Math.random() * 1000000) + 1);

    console.log(otp + "otp is");


    if (data.email) {
      var mailOptions = {
        from: 'miteshdobariya2206@gmail.com',
        to: data.email,
        subject: 'Verification mail',
        text: `${otp}`,
      };
    }

    console.log(otp);
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
        console.log(otp);
      }
    });


    res.status(200).json({
      status: "done",
      data
    })
  }
  catch (err) {
    console.log(err + "1234567");

    res.status(400).json({
      status: "err",
      err
    })
  }
});



router.patch('/checkotp', async function (req, res, next) {
  var msg;
  try {
    console.log(otp);
    var userotp = req.body.otp;


    if (req.body.password == req.body.newpassword) {

      if (userotp == otp) {

        var cryptpass = await bcrypt.hash(req.body.password, 10)
        var obj = {
          'password': cryptpass
        }


        await user.findByIdAndUpdate(id, obj);
        console.log("**************************");
        console.log(obj.password);
        console.log(id);
        console.log("**************************");

        res.status(200).json({

          status: "done",
          msg

        })
      }
      else {

        res.status(400).json({
          status: "err"
        })

      }
    }


    else {
      console.log("successsssssssssssssssssssssssss");

      res.status(400).json({
        status: "missmatch",

      })

    }
  }
  catch (err) {
    res.status(400).json({
      status: "err"
    })
  }
});


// ---------------------------------------------------------------




module.exports = router;
