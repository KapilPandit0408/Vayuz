app.post("/login", async (req, res) => {
try {
const { email, password } = req.body;

          if (!email || !password)
            return res.status(400).json({ msg: "Not all fields have been entered." });

          const user = await User.findOne({ email: email });
          if (!user)
            return res
              .status(400)
              .json({ msg: "No account with this email has been registered." });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return res.status(400).json({ msg: "Invalid credentials." });

          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
          res.render("success",{
            token,
            user: {
                name:user.name,
              id: user._id,
              email: user.email,
              date: user.date,
              image:user.image.url
            },
          })
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
