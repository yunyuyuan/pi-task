import React from "react";
import './todo.scss';
import {Button, Input, List, Modal, notification} from "antd";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  SmileOutlined,
  CloudUploadOutlined,
  FieldStringOutlined, CaretUpOutlined, CaretDownOutlined, SyncOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import {createCommit, encrypt, decrypt, getFileContent, isAuthor} from "../../utils/github";
const path = 'files/todo.json';

export default class TodoComponent extends React.Component {
  id = 1;

  constructor(props) {
    super(props);
    this.state = {
      todoList: [],
      isModalVisible: false,
      isPwdModalVisible: false,
      tokenInput: props.token,
      pwdInput: '',
      
      tokenUpdating: false,
      todoRefreshing: false,
      todoUpdating: false,
    }
  }
  
  async refreshTodo() {
    if (this.errPwd()) return;
    this.setState({
      todoRefreshing: true,
    })
    const result_ = await getFileContent(path, this.props.token);
    if (typeof result_ === 'string') {
      const result = decrypt(result_, this.state.pwdInput);
      if (result.startsWith('[')) {
        const todo = JSON.parse(result);
        return this.setState({
          todoList: (todo instanceof Array) ? todo.map(v => {
            return {
              text: v,
              id: this.id++
            }
          }) : [],
          todoRefreshing: false,
        })
      }
    }
    this.setState({
      todoRefreshing: false,
    })
  }
  
  setPwd() {
    this.setState({isPwdModalVisible: false});
    this.refreshTodo().then();
  }
  
  addTodo() {
    this.setState({
      todoList: [...this.state.todoList, {
        id: this.id ++,
        text: ''
      }],
    });
  }

  rmTodo(el) {
    this.setState({
      todoList: [...this.state.todoList.filter(v=>v.id !== el.id)],
    });
  }

  upTodo(idx) {
    let temp = this.state.todoList.slice();
    temp.splice(idx-1, 2, temp[idx], temp[idx-1]);
    this.setState({
      todoList: temp,
    });
  }

  downTodo(idx) {
    let temp = this.state.todoList.slice();
    temp.splice(idx, 2, temp[idx+1], temp[idx]);
    this.setState({
      todoList: temp,
    });
  }
  
  updateText(el, event) {
    const temp = this.state.todoList.slice();
    temp.find(v => v.id === el.id).text = event.target.value;
    this.setState({
      todoList: temp,
    })
  }
  
  async setToken() {
    const token = this.state.tokenInput;
    this.setState({
      tokenUpdating: true,
    })
    const can = await isAuthor(token);
    if (can || token === '') {
      this.props.updateToken(token);
    }
    this.setState({
      tokenUpdating: false,
      isModalVisible: !can
    })
  }
  
  async upload() {
    if (this.errPwd()) return;
    const content = JSON.stringify(this.state.todoList.map(v => v.text));
    this.setState({
      todoUpdating: true,
    })
    const result = await createCommit(this.props.token, '[update todo]', [{
      path,
      content: encrypt(content, this.state.pwdInput)
    }]);
    if (result) {
      notification.success({
        message: '更新成功!'
      })
    }
    this.setState({
      todoUpdating: false,
    })
  }
  
  errPwd() {
    if (!this.state.pwdInput) {
      notification.error({
        message: '错误',
        description: 'pwd不能为空!'
      })
      return true;
    }
  }
  
  render() {
    return (
      <div className='--page-todo flexc'>
        <List
          className='todo-list'
          size="small"
          header={<h2 className='flex'><SmileOutlined style={{fontSize: '24px', marginRight: '10px'}} />Todo List
                    <Button loading={this.state.todoRefreshing} type='text' onClick={() => this.refreshTodo()} icon={<SyncOutlined/>}/>
                  </h2>}
          footer={<Button onClick={()=>this.addTodo()} icon={<PlusCircleOutlined />}>添加</Button>}
          bordered
          dataSource={this.state.todoList}
          locale={{emptyText: '啥事没有吗?'}}
          renderItem={(item,idx) => 
            <List.Item>
              <div className='flex todo-item'>
                <b>{idx+1}</b>
                <Input 
                  size='large'
                  value={item.text} 
                  onChange={(event)=>this.updateText(item, event)}/>
                {
                  idx === 0?null:<Button 
                  onClick={()=>this.upTodo(idx)}  
                  size='small' type="primary" shape='circle' 
                  icon={<CaretUpOutlined />}/>
                }                
                {
                  idx === this.state.todoList.length-1?null:<Button 
                  onClick={()=>this.downTodo(idx)}  
                  size='small' type="primary" shape='circle' 
                  icon={<CaretDownOutlined />}/>
                }
                <Button
                  onClick={()=>this.rmTodo(item)}  
                  size='small' type="primary" shape='circle' danger 
                  icon={<DeleteOutlined/>}/>
              </div>
            </List.Item>}
        />
        <div className='foot'>
          <Button type="dashed" icon={<EyeInvisibleOutlined />} onClick={()=>this.setState({isPwdModalVisible: true})}>Pwd</Button>
          <Button type="dashed" icon={<FieldStringOutlined />} onClick={()=>this.setState({isModalVisible: true})}>Token</Button>
          <Button type="primary" loading={this.state.todoUpdating} disabled={!this.props.token} icon={<CloudUploadOutlined />} onClick={()=>this.upload()}>提交</Button>
        </div>
        
        <Modal title="Github Token" visible={this.state.isModalVisible} 
               onOk={()=>this.setToken()} onCancel={()=>this.setState({isModalVisible: false})} 
               confirmLoading={this.state.tokenUpdating}>
          <Input 
            size='large'
            value={this.state.tokenInput} 
            onChange={(event)=>this.setState({tokenInput: event.target.value})}/>
        </Modal>
        
        <Modal title="Encrypt Password" visible={this.state.isPwdModalVisible} 
               onOk={()=>this.setPwd()} onCancel={()=>this.setState({isPwdModalVisible: false})}>
          <Input 
            size='large'
            value={this.state.pwdInput} 
            onChange={(event)=>this.setState({pwdInput: event.target.value})}/>
        </Modal>
      </div>
    )
  }
}
