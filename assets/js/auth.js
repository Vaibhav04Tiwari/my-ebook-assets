// auth.js - AWS Cognito Authentication Module
// Place this file in assets/js/auth.js

export class AuthManager {
  constructor(config) {
    this.poolData = {
      UserPoolId: config.userPoolId,
      ClientId: config.clientId
    };
    this.cognitoUser = null;
    this.userPool = null;
    this.initCognito();
  }

  initCognito() {
    // Initialize AWS Cognito User Pool
    this.userPool = new AmazonCognitoIdentity.CognitoUserPool(this.poolData);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      return new Promise((resolve) => {
        cognitoUser.getSession((err, session) => {
          if (err || !session.isValid()) {
            resolve(false);
          } else {
            this.cognitoUser = cognitoUser;
            resolve(true);
          }
        });
      });
    }
    return Promise.resolve(false);
  }

  // Sign Up
  signUp(email, password, name) {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'email',
          Value: email
        }),
        new AmazonCognitoIdentity.CognitoUserAttribute({
          Name: 'name',
          Value: name
        })
      ];

      this.userPool.signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Confirm Sign Up with verification code
  confirmSignUp(email, code) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool
      };
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  }

  // Sign In
  signIn(email, password) {
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: email,
        Password: password
      };
      const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

      const userData = {
        Username: email,
        Pool: this.userPool
      };
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          this.cognitoUser = cognitoUser;
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        }
      });
    });
  }

  // Sign Out
  signOut() {
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      this.cognitoUser = null;
    }
  }

  // Get current user info
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.userPool.getCurrentUser();
      if (!cognitoUser) {
        reject(new Error('No user logged in'));
        return;
      }

      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err);
          return;
        }

        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
            return;
          }

          const userData = {};
          attributes.forEach(attr => {
            userData[attr.Name] = attr.Value;
          });
          resolve(userData);
        });
      });
    });
  }

  // Forgot Password
  forgotPassword(email) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool
      };
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

      cognitoUser.forgotPassword({
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err)
      });
    });
  }

  // Confirm new password with code
  confirmPassword(email, code, newPassword) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: this.userPool
      };
      const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err)
      });
    });
  }
}