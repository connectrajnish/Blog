require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const port = 8080;

// Initialize the app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static('uploads'))

const uri = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to Database :: MongoDB'))
  .catch(error => console.log("Error in connecting to DB: ", error));
// Create a blog schema
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    image: String,
    status: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: {
      createdAt: 'created_at', // Use `created_at` to store the created date
      updatedAt: 'updated_at' // and `updated_at` to store the last updated date
    }
  }
);
const Blog = mongoose.model('Blog', blogSchema);


//Storage engine for multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../client/public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});


// Routes
app.get('/blogs', (req, res) => {
  Blog.find()
    .then(blogs => res.json(blogs))
    .catch(error => res.status(400).json('Error: ' + error));
});

app.post('/blogs', upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  const image = req.file; // Access the uploaded image file

  const newBlog = new Blog({
    title,
    content,
    image: image ? image.path : null, // Store the image path in the blog document
    status: true
  });

  newBlog.save()
    .then(() => res.json('Blog added'))
    .catch(error => res.status(400).json('Error: ' + error));
});


// Update a blog
app.put('/blogs/:id', (req, res) => {
  const { title, content } = req.body;
  const blogId = req.params.id;

  Blog.findByIdAndUpdate(blogId, { title, content }, { new: true })
    .then(() => res.json('Blog updated'))
    .catch(error => res.status(400).json('Error: ' + error));
});

// Autosave route
app.post('/blogs/:id/autosave', (req, res) => {
  const { content } = req.body;
  const blogId = req.params.id;

  Blog.findByIdAndUpdate(blogId, { content }, { new: true })
    .then(() => res.json('Blog autosaved'))
    .catch(error => res.status(400).json('Error: ' + error));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
