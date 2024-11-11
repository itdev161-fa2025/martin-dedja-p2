import moongoose from 'mongoose';

const UserSchema = new moongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
});

const User = moongoose.model('user', UserSchema);

export default User;