// Webpack DefinePlugin
declare const environment: {
    NODE_ENV: string;
    HOST: string;
};

const environmental = environment;

export { environmental as environment };
