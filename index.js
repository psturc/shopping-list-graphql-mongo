const { MongoClient } = require('mongodb')
const { ApolloServer, gql } = require('apollo-server')

// Mongo configuration
const MONGO_HOST = process.env.MONGO_HOST || "0.0.0.0"
const MONGO_PORT = process.env.MONGO_PORT || "27017"
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "shopping-list"
const MONGO_URL = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`
const MONGO_COLLECTION_NAME = "items"

const prepare = o => {
    o._id = o._id.toString()
    return o
}

const start = async () => {
    try {
        const client = await MongoClient.connect(MONGO_URL)
        const Items = await client.db(MONGO_DB_NAME).collection(MONGO_COLLECTION_NAME)

        const typeDefs = gql`
            type Query {
                items: [Item]
            }

            type Item {
                _id: String
                name: String
                amount: Int
            }

            type Mutation {
                createItem(name: String, amount: Int): Item
            }

            schema {
                query: Query
                mutation: Mutation
            }
        `

        const resolvers = {
            Query: {
                items: async () => {
                    return (
                        await Items.find({}).toArray()
                    ).map(prepare)
                }
            },
            Mutation: {
                createItem: async (_, args) => {
                    const res = await Items.insertOne(args)
                    return prepare(await Items.findOne({_id: res.insertedId}))
                }
            }
        }

        const server = new ApolloServer({
            typeDefs,
            resolvers
        })

        server.listen().then(({ url }) => {
            console.log(`🚀 Server ready at ${url}`)
        })

    } catch(e) {
        console.log(e)
    }
}

start()