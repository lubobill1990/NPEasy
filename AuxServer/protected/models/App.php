<?php

/**
 * This is the model class for table "npeasy_app".
 *
 * The followings are the available columns in table 'npeasy_app':
 * @property string $id
 * @property string $app_key
 * @property string $app_secret
 * @property string $redirect_uri
 */
class App extends CActiveRecord
{
	/**
	 * Returns the static model of the specified AR class.
	 * @param string $className active record class name.
	 * @return App the static model class
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
		return 'npeasy_app';
	}

	/**
	 * @return array validation rules for model attributes.
	 */
	public function rules()
	{
		// NOTE: you should only define rules for those attributes that
		// will receive user inputs.
		return array(
			array('app_key, app_secret', 'length', 'max'=>50),
			array('redirect_uri', 'length', 'max'=>255),
			// The following rule is used by search().
			// Please remove those attributes that should not be searched.
			array('id, app_key, app_secret, redirect_uri', 'safe', 'on'=>'search'),
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
			'id' => 'ID',
			'app_key' => 'App Key',
			'app_secret' => 'App Secret',
			'redirect_uri' => 'Redirect Uri',
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

		$criteria->compare('id',$this->id,true);
		$criteria->compare('app_key',$this->app_key,true);
		$criteria->compare('app_secret',$this->app_secret,true);
		$criteria->compare('redirect_uri',$this->redirect_uri,true);

		return new CActiveDataProvider($this, array(
			'criteria'=>$criteria,
		));
	}
}