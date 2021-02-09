const { db } = require('../util/admin');

exports.getAllHollas = (req, res) => {
    db.collection("hollas")
      .orderBy("createdAt", "desc")
      .get()
      .then((data) => {
        let hollas = [];
        data.forEach((doc) => {
          hollas.push({
            hollaId: doc.id,
            ...doc.data(),
          });
        });
        return res.json(hollas);
      })
      .catch((err) => console.log(error(err)));
}

exports.postOneHolla = (req, res) => {
    if (req.body.body.trim() === '') {
      return res.status(400).json({ body: 'Body must not be empty' });
    }
  
    const newHolla = {
      body: req.body.body,
      userHandle: req.user.handle,
      createdAt: new Date().toISOString(),
      userImage: req.user.imageUrl,
      likeCount: 0,
      commentCount: 0
    };
  
    db.collection("hollas")
      .add(newHolla)
      .then((doc) => {
        const resHolla = newHolla;
        resHolla.hollaId = doc.id;
        res.json({ resHolla });
      })
      .catch((err) => {
        res.status(500).json({ error: "something went wrong" });
        console.error(err);
      });
}

exports.getHolla = (req, res) => {
    let hollaData = {};
    db.doc(`/hollas/${req.params.hollaId}`)
    .get()
    .then(doc => {
      if(!doc.exists) {
        return res.status(404).json({ error: 'Holla not found' })
      }
      hollaData = doc.data();
      hollaData.hollaId = doc.id;
      return db
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .where('hollaId', '==', req.params.hollaId)
      .get();
      })
      .then((data) => {
        hollaData.comments = [];
        data.forEach((doc) => {
          hollaData.comments.push(doc.data());
        });
        return res.json(hollaData)
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: err.code });
    })
}

exports.commentOnHolla = (req, res) => {
  if(req.body.body.trim() === '') return res.status(400).json({ error: 'Must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    hollaId: req.params.hollaId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };

  db.doc(`/hollas/${req.params.hollaId}`).get()
  .then(doc => {
    if(!doc.exists) {
      return res.status(404).json({ error: 'Holla not found' });
    }
    return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
  })
  .then(() => {
    return db.collection('comments').add(newComment);
  })
  .then(() => {
    res.json(newComment);
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  });
}

exports.likeHolla = (req, res) => {
  const likeDoc = db.collection('likes')
  .where('userHandle', '==', req.user.handle)
  .where('hollaId', '==', req.params.hollaId)
  .limit(1);

  const hollaDoc = db.doc(`/hollas/${req.params.hollaId}`);

  let hollaData;

  hollaDoc.get()
  .then(doc => {
    if(doc.exists) {
      hollaData = doc.data();
      hollaData.hollaId = doc.id;
      return likeDoc.get();
    } else {
      return res.status(404).json({ error: 'Holla not found' });
    }
  })
  .then(data => {
    if(data.empty) {
      return db.collection('likes').add({
        hollaId: req.params.hollaId,
        userHandle: req.user.handle
      })
      .then(() => {
        hollaData.likeCount++;
        return hollaDoc.update({ likeCount: hollaData.likeCount });
      })
      .then(() => {
        return res.json(hollaData);
      });
    } else {
      return res.status(400).json({ error: 'Holla already liked' });
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: err.code });
  })
}

exports.unlikeHolla = (req, res) => {
  const likeDoc = db.collection('likes')
  .where('userHandle', '==', req.user.handle)
  .where('hollaId', '==', req.params.hollaId)
  .limit(1);

  const hollaDoc = db.doc(`/hollas/${req.params.hollaId}`);

  let hollaData;

  hollaDoc.get()
  .then(doc => {
    if(doc.exists) {
      hollaData = doc.data();
      hollaData.hollaId = doc.id;
      return likeDoc.get();
    } else {
      return res.status(404).json({ error: 'Holla not found' });
    }
  })
  .then(data => {
    if(data.empty) {
      return res.status(400).json({ error: 'Holla not liked' });
    } else {
      return db.doc(`/likes/${data.docs[0].id}`).delete()
      .then(() => {
        hollaData.likeCount--;
        return hollaDoc.update({ likeCount: hollaData.likeCount });
      })
      .then(() => {
        return res.json(hollaData);
      })
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: err.code });
  })
}

exports.deleteHolla = (req, res) => {
  const document = db.doc(`/hollas/${req.params.hollaId}`);
  document.get()
  .then(doc => {
    if(!doc.exists){
      return res.status(404).json({ error: 'Holla not found' });
    }
    if(doc.data().userHandle !== req.user.handle) {
      return res.status(403).json({ error: 'Unauthorized access' });
    } else {
      return document.delete();
    }
  })
  .then(() => {
    res.json({ message: 'Scream deleted successfully' });
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({ error: err.code });
  })
}