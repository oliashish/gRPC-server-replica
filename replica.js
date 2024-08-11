import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const PROTO_PATH = './tasks.proto';  // Ensure this path is correct
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const taskProto = protoDescriptor.TaskService;

let businessLogic;

// Initialize business logic
function initialize(call, callback) {
    const { code } = call.request;
    businessLogic = new Function('task', code);
    callback(null, { message: 'Business logic received and initialized' });
}

// Execute task
function execute(call, callback) {
    const { task } = call.request;
    if (businessLogic) {
        try {
            const result = businessLogic(task);
            callback(null, { result: JSON.stringify(result) });
        } catch (error) {
            callback(new Error('Business logic execution failed: ' + error.message), null);
        }
    } else {
        callback(new Error('Business logic not initialized'), null);
    }
}

const server = new grpc.Server();
server.addService(taskProto.service, { Initialize: initialize, Execute: execute });
const port = process.argv[2] || 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
});
