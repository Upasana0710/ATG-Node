import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: "String",
        required: true
    },
    replies: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Comment",
        default: []
    }
})

export default mongoose.model("Comment",commentSchema);