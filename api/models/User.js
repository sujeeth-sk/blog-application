import { Schema, model } from "mongoose";
/* 
another way to do would be to 
const {Schema} = mongoos;
const UserSChaem = new Schema();
*/

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      min: 4,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);

export default UserModel;
