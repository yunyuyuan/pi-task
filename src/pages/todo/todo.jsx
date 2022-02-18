import React from "react";
import './todo.scss';
import {Button, Input, List, Modal, notification} from "antd";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  SmileOutlined,
  CloudUploadOutlined,
  FieldStringOutlined, CaretUpOutlined, CaretDownOutlined, SyncOutlined
} from '@ant-design/icons';
import {token} from "../../utils/data";
import {createCommit, getFileContent, isAuthor} from "../../utils/github";
const path = 'files/todo.json';

export default class TodoComponent extends React.Component {
  id = 1;

  constructor(props) {
    super(props);
    this.state = {
      todoList: [],
      isModalVisible: false,
      token: props.token,
      
      tokenUpdating: false,
      todoRefreshing: false,
      todoUpdating: false,
    }
  }
  
  async refreshTodo() {
    this.setState({
      todoRefreshing: true,
    })
    const todo = JSON.parse(await getFileContent(path));
    this.setState({
      todoList: (todo instanceof Array) ? todo.map(v => {
        return {
          text: v,
          id: this.id ++
        }
      }) : [],
      todoRefreshing: false,
    })
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
  
  updateToken(event) {
    this.setState({
      token: event.target.value,
    });
  }
  
  async setToken() {
    this.setState({
      tokenUpdating: true,
    })
    token.value = this.state.token;
    const can = await isAuthor();
    if (can) {
      this.props.updateToken(this.state.token);
    } else {
      
    }
    this.setState({
      tokenUpdating: false,
      isModalVisible: !can
    })
  }
  
  async upload() {
    const content = JSON.stringify(this.state.todoList.map(v => v.text));
    this.setState({
      todoUpdating: true,
    })
    const result = await createCommit('[update todo]', [{
      path,
      content
    }]);
    if (result) {
      notification.open({
        message: '更新成功!'
      })
    }
    this.setState({
      todoUpdating: false,
    })
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
          <Button type="dashed" icon={<FieldStringOutlined />} onClick={()=>this.setState({isModalVisible: true})}>Token</Button>
          <Button type="primary" loading={this.state.todoUpdating} disabled={!this.props.token} icon={<CloudUploadOutlined />} onClick={()=>this.upload()}>提交</Button>
        </div>
        
        <Modal title="Github Token" visible={this.state.isModalVisible} 
               onOk={()=>this.setToken()} onCancel={()=>this.setState({isModalVisible: false})} 
               confirmLoading={this.state.tokenUpdating}>
          <Input 
            size='large'
            value={this.state.token} 
            onChange={(event)=>this.updateToken(event)}/>
        </Modal>
      </div>
    )
  }
}
