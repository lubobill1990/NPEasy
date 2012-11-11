<?php

/**
 * This is the model class for table "npeasy_auth_code".
 *
 * The followings are the available columns in table 'npeasy_auth_code':
 * @property string $auth_code
 * @property string $app_key
 * @property integer $user_id
 * @property integer $expire_till
 */
class AuthCode extends CActiveRecord
{
	/**
	 * Returns the static model of the specified AR class.
	 * @param string $className active record class name.
	 * @return AuthCode the static model class
	 */
	public static function model($className=__CLASS__)
	{
		return parent::model($className);
	}

	/**
	 * @return string the associated database table name
	 */
	public function tableName()
	{
		return 'npeasy_auth_code';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('user_id, expire_till', 'required'),
			array('user_id, expire_till', 'numerical', 'integerOnly'=>true),
			array('auth_code, app_key', 'length', 'max'=>50),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('auth_code, app_key, user_id, expire_till', 'safe', 'on'=>'search'),
		);
	}

	/**
	 * @return array relational rules.
	 */
	public function relations()
	{
		// NOTE: you may need to adjust the relation name and the related
		// class name for the relations automatically generated below.
		return array(
		);
	}

	/**
	 * @return array customized attribute labels (name=>label)
	 */
	public function attributeLabels()
	{
		return array(
			'auth_code' => 'Auth Code',
			'app_key' => 'App Key',
			'user_id' => 'User',
			'expire_till' => 'Expire Till',
		);
	}

	/**
	 * Retrieves a list of models based on the current search/filter conditions.
	 * @return CActiveDataProvider the data provider that can return the models based on the search/filter conditions.
	 */
	public function search()
	{
		// Warning: Please modify the following code to remove attributes that
		// should not be searched.

		$criteria=new CDbCriteria;

		$criteria->compare('auth_code',$this->auth_code,true);
		$criteria->compare('app_key',$this->app_key,true);
		$criteria->compare('user_id',$this->user_id);
		$criteria->compare('expire_till',$this->expire_till);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}
}