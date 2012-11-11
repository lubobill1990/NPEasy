<?php

/**
 * This is the model class for table "npeasy_access_token".
 *
 * The followings are the available columns in table 'npeasy_access_token':
 * @property string $access_token
 * @property string $app_key
 * @property integer $user_id
 * @property integer $expire_till
 * @property string $create_time
 */
class AccessToken extends CActiveRecord
{
	/**
	 * Returns the static model of the specified AR class.
	 * @param string $className active record class name.
	 * @return AccessToken the static model class
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
		return 'npeasy_access_token';
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
			array('access_token, app_key', 'length', 'max'=>50),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('access_token, app_key, user_id, expire_till, create_time', 'safe', 'on'=>'search'),
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
			'access_token' => 'Access Token',
			'app_key' => 'App Key',
			'user_id' => 'User',
			'expire_till' => 'Expire Till',
			'create_time' => 'Create Time',
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

		$criteria->compare('access_token',$this->access_token,true);
		$criteria->compare('app_key',$this->app_key,true);
		$criteria->compare('user_id',$this->user_id);
		$criteria->compare('expire_till',$this->expire_till);
		$criteria->compare('create_time',$this->create_time,true);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}
}