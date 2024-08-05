import { CognitoUserPool, ICognitoUserPoolData } from "amazon-cognito-identity-js";

const poolData: ICognitoUserPoolData = {
    UserPoolId: "us-east-1_HaEmCsWfL",
    ClientId: "nb1b5a89n7bj1n67pa6faoi92"

}
export default new CognitoUserPool(poolData);