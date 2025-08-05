// Define the Mongoose schema and model
const mainengineerSchema = new mongoose.Schema({
    engineerId: { type: String, required: true, unique: true }, // Add type and constraints
    name: { type: String, required: true },
    img: { type: String, required: true },
    qualifications: { type: String, required: true },
    profileLink: { type: String, required: true }
});

const Engineer = mongoose.model('main', engineerSchema); // 'main' is the collection name
