const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require('./util/FBAuth');
const { db } = require('./util/admin');

const { 
    getAllHollas, 
    postOneHolla,
    getHolla,
    commentOnHolla,
    likeHolla,
    unlikeHolla,
    deleteHolla,
} = require('./handlers/hollas');
const { 
    signup, 
    login, 
    uploadImage, 
    addUserDetails,
    getAuthenticatedUser,
    getUserDetails,
    markNotificationsRead
} = require('./handlers/users');

//hollas
app.get("/hollas", getAllHollas);
app.post("/holla", FBAuth, postOneHolla);
app.get('/holla/:hollaId', getHolla);
app.delete('/holla/:hollaId', FBAuth, deleteHolla);
app.get('/holla/:hollaId/like', FBAuth, likeHolla);
app.get('/holla/:hollaId/unlike', FBAuth, unlikeHolla);
app.post('/holla/:hollaId/comment', FBAuth, commentOnHolla);

//users
app.post("/signup", signup);
app.post("/login", login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.region('us-central1').firestore.document('likes/{id}')
.onCreate((snapshot) => {
    db.doc(`/hollas/${snapshot.data().hollaId}`).get()
    .then(doc => {
        if(doc.exists) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'like',
                read: false,
                hollaId: doc.id
            });
        }
    })
    .then(() => {
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    })
});

exports.deleteNotificationOnUnlike = functions.region('us-central1').firestore.document('likes/{id}')
.onDelete((snapshot) => {
    db.doc(`/notifications/${snapshot.id}`)
    .delete()
    .then(() => {
        return;
    })
    .catch (err => {
        console.error(err);
        return;
    })
})

exports.createNotificationOnComment = functions.region('us-central1').firestore.document('comments/{id}')
.onCreate((snapshot) => {
    db.doc(`/hollas/${snapshot.data().hollaId}`).get()
    .then(doc => {
        if(doc.exists) {
            return db.doc(`/notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient: doc.data().userHandle,
                sender: snapshot.data().userHandle,
                type: 'comment',
                read: false,
                hollaId: doc.id
            });
        }
    })
    .then(() => {
        return;
    })
    .catch(err => {
        console.error(err);
        return;
    })
});