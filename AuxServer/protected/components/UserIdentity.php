<?php

/**
 * UserIdentity represents the data needed to identity a user.
 * It contains the authentication method that checks if the provided
 * data can identity the user.
 */
class UserIdentity extends CUserIdentity {
	private $user_id;

	public function getId() {
		return $this -> user_id;
	}

	/**
	 * Authenticates a user.
	 * The example implementation makes sure if the username and password
	 * are both 'demo'.
	 * In practical applications, this should be changed to authenticate
	 * against some persistent user identity storage (e.g. database).
	 * @return boolean whether authentication succeeds.
	 */
	public function authenticate() {
		$user = User::model() -> find('email=:username', array(':username' => $this -> username));
		$this -> user_id = $user -> id;
		if ($user === NULL) {
			$this -> errorCode = self::ERROR_USERNAME_INVALID;
		} else {
			if ($user->authorizePassword($this->password)) {
				$this -> errorCode = self::ERROR_NONE;
			} else {
				$this -> errorCode = self::ERROR_PASSWORD_INVALID;
			}
		}
		return !$this -> errorCode;
	}

}
