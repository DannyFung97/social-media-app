let db = {
    users: [
        {
            userId: 'fasd',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2021-02-08T03:09:39.279Z',
            imageUrl: 'image/aavsdfa',
            bio: 'hi, I am user',
            website: 'https://user.com',
            location: 'San Diego, California'
        }
    ],
    hollas: [
        {
            userHandle: 'user',
            body: 'holla body',
            createdAt: '2021-02-08T03:09:39.279Z',
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            hollaId: 'ascdfasdfv',
            body: 'holla body',
            createdAt: '2021-02-08T03:09:39.279Z'
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'john',
            read: 'true | false',
            hollaId: 'fasdf',
            type: 'like | comment',
            createdAt: '2021-02-08T03:09:39.279Z'
        }
    ]
};

//redux data
const userDetails = {
    credentials: {
        userId: 'fasd',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2021-02-08T03:09:39.279Z',
        imageUrl: 'image/aavsdfa',
        bio: 'hi, I am user',
        website: 'https://user.com',
        location: 'San Diego, California'
    },
    likes: [
        {
            userHandle: 'user',
            hollaId: 'asdfv'
        },
        {
            userHandle: 'user2',
            hollaId: 'asdfvfd'
        }
    ]
}