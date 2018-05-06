import Koa from 'koa';
import KoaRouter from 'koa-router';
import koaBody from 'koa-bodyparser';
import { find, filter } from 'lodash';
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import { makeExecutableSchema } from 'graphql-tools';
import config from './config/conf.base';

const app = new Koa();
const router = new KoaRouter();

app.use(koaBody());

// example data
const authors = [{
    id: 1,
    firstName: 'Tom',
    lastName: 'Coleman'
  },
  {
    id: 2,
    firstName: 'Sashko',
    lastName: 'Stubailo'
  },
  {
    id: 3,
    firstName: 'Mikhail',
    lastName: 'Novikov'
  },
];
const posts = [{
    id: 1,
    authorId: 1,
    title: 'Introduction to GraphQL',
    votes: 2
  },
  {
    id: 2,
    authorId: 2,
    title: 'Welcome to Meteor',
    votes: 3
  },
  {
    id: 3,
    authorId: 2,
    title: 'Advanced GraphQL',
    votes: 1
  },
  {
    id: 4,
    authorId: 3,
    title: 'Launchpad is Cool',
    votes: 7
  },
];

const arr = [
  `
    type Author {
      id: Int!
        firstName: String
      lastName: String
      posts: [Post]# the list of Posts by this author
    }

    type Post {
      id: Int!
      title: String
      author: Author
      votes: Int
    }

    #the schema allows the following query:
    type Query {
      posts: [Post]
      author(id: Int!): Author
    }
  `,
  `
    #this schema allows the following mutation:
      type Mutation {
        upvotePost(
          postId: Int!
        ): Post
      }
  `
]
const typeDefs = arr.join('')

const resolvers = {
  Query: {
    posts: () => posts,
    author: (_, {
      id
    }) => find(authors, {
      id: id
    }),
  },
  Mutation: {
    upvotePost: (_, {
      postId
    }) => {
      const post = find(posts, {
        id: postId
      });
      if (!post) {
        throw new Error(`Couldn't find post with id ${postId}`);
      }
      post.votes += 1;
      return post;
    },
  },
  Author: {
    posts: (author) => filter(posts, {
      authorId: author.id
    }),
  },
  Post: {
    author: (post) => find(authors, {
      id: post.authorId
    }),
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// router.post('/graphql', graphqlKoa({ schema: myGraphQLSchema }));
router.post('/graphql', graphqlKoa(ctx => {
  console.log('---')
  console.log(ctx.request.header)
  return {
    schema: schema,
    passHeader: `'Authorization': 'Bearer lorem ipsum'`
  }
}));
router.get('/graphiql', graphiqlKoa({ 
  endpointURL: '/graphql' 
}));

router.get('/graphql', graphqlKoa(ctx => {
  console.log(ctx.request)

  return {
    schema: schema,
    context: {}
  }
}));


app.use(router.routes());
app.use(router.allowedMethods());
app.listen(config.serverPort, () => {
  console.log('open http://localhost:9000/graphiql');
});
