const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./util/FBAuth");
const cors = require('cors');
app.use(cors());
const { db } = require("./util/admin");

const {
  getAllHollas,
  postOneHolla,
  getHolla,
  commentOnHolla,
  likeHolla,
  unlikeHolla,
  deleteHolla,
} = require("./handlers/hollas");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");

//hollas
app.get("/hollas", getAllHollas);
app.post("/holla", FBAuth, postOneHolla);
app.get("/holla/:hollaId", getHolla);
app.delete("/holla/:hollaId", FBAuth, deleteHolla);
app.get("/holla/:hollaId/like", FBAuth, likeHolla);
app.get("/holla/:hollaId/unlike", FBAuth, unlikeHolla);
app.post("/holla/:hollaId/comment", FBAuth, commentOnHolla);

//users
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onCreate((snapshot) => {
    return db.doc(`/hollas/${snapshot.data().hollaId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "like",
            read: false,
            hollaId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });

exports.deleteNotificationOnUnlike = functions
  .region("us-central1")
  .firestore.document("likes/{id}")
  .onDelete((snapshot) => {
    return db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("us-central1")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    return db.doc(`/hollas/${snapshot.data().hollaId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            hollaId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("us-central1")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db.collection("hollas").where("userHandle", "==", change.before.data().handle).get()
        .then((data) => {
          data.forEach((doc) => {
            const holla = db.doc(`/hollas/${doc.id}`);
            batch.update(holla, { userImage: change.after.data().imageUrl });
          });
          return db.collection('comments').where('userHandle', '==', change.before.data().handle).get()
        })
        .then((data) => {
          data.forEach((doc) => {
            const comment = db.doc(`/comments/${doc.id}`);
            batch.update(comment, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        })
    } else return true;
  });

exports.onHollaDelete = functions
  .region('us-central1')
  .firestore.document('/hollas/{hollaId}')
  .onDelete((snapshot, context) => {
    const hollaId = context.params.hollaId;
    const batch = db.batch();
    return db.collection('comments').where('hollaId', '==', hollaId).get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('hollaId', '==', hollaId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection('notifications').where('hollaId', '==', hollaId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
