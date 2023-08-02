'use strict'
const Controller = require('egg').Controller
/**
 * @controller User 用户模块
 */
class UserController extends Controller {
  /**
   * @summary 注册
   * @description 注册用户信息
   * @router post /v1/user/register
   * @request body RequestRegister
   * @response 200 ResponseRegister 注册成功
   * @response 400 ErrorResponse 注册失败参数问题
   * @response 409 ErrorResponseAlreadyRegistered 邮箱已被注册
   */
  async register() {
    const ctx = this.ctx
    const { service, helper, request, validate, rule } = this.ctx
    try {
      // 参数校验
      const passed = await validate.call(this, rule.RequestRegister, request.body)
      if (!passed) {
        const err = new Error('参数验证错误');
        err.status = 400;
        throw err;
      }
      const { username, email, password, phone, avatar_url } = ctx.request.body;
      const hashedPassword = await ctx.hashPassword(password); // 使用 bcrypt 进行密码加密
      const user = await ctx.service.user.create({ username, email, password: hashedPassword, phone, avatar_url });
      //不返回密码
      delete user.password;
      helper.success(user, '注册成功')
    } catch (error) {
      console.error(error);
      helper.error(error.status, error.message)
    }
  }
  /**
 * @summary 登录
 * @description 使用用户名或者邮箱登录
 * @router post /v1/user/login
 * @request body RequestLogin
 * @response 200 ResponseLogin 登录成功
 * @response 400 ErrorResponse 参数问题登录失败
 * @response 401 ResponseLoginFailed 登录失败,用户名或密码错误
 */
  async login() {
    const { service, helper, request, validate, rule } = this.ctx
    const { usernameOrEmail, password } = request.body;
    try {
      // 参数校验
      const passed = await validate.call(this, rule.RequestLogin, request.body)
      if (!passed) {
        const err = new Error('参数验证错误');
        err.status = 400;
        throw err;
      }
      // 调用 Service 进行登陆
      const { userObject: user, token } = await service.user.login({ usernameOrEmail, password });
      // 返回用户信息和 token
      helper.success({ user, token }, "登录成功");
    } catch (err) {
      // 将错误信息返回给客户端
      helper.error(err.status, err.message)
    }
  }
  /**
 * @summary 修改个人信息
 * @description 修改个人信息,username,email,phone都是可选的
 * @router post /v1/user/update
 * @request body RequestUpdateUser
 * @response 200 ResponseUpdate 登录成功
 * @response 400 ErrorResponse 参数问题登录失败
 * @response 409 ErrorResponseAlreadyRegistered 提供的username,email,phone已被注册
 * @response 601 ErrorResponseUnauthorized 未登录
 */
  async update() {
    const { service, helper, request, validate, rule } = this.ctx
    const { ctx } = this;
    try {
      // 获取用户ID和请求参数
      const userId = ctx.state.user.id;
      // 参数校验
      const passed = await validate.call(this, rule.RequestUpdateUser, request.body)
      if (!passed) {
        const err = new Error('参数验证错误');
        err.status = 400;
        throw err;
      }
      const { username, email, phone, password } = request.body;
      // 调用服务更新用户信息
      let result = await ctx.service.user.update(userId, { username, email, phone, password });
      //不返回password
      const { password: _, ...resresult } = result.toJSON();
      // 返回成功响应
      helper.success(resresult, "更新成功");
    } catch (err) {
      // 将错误信息返回给客户端
      helper.error(err.status, err.message)
    }
  }

  async info() {
    const { service, helper, request, validate } = this.ctx
    const result = await service.user.info();
    helper.success(result, "获取成功")
  }
  /**
 * @summary 修改个人信息
 * @description 修改个人信息,username,email,phone都是可选的
 * @router post /v1/user/checkExist
 * @request body RequestcheckExist
 * @response 200 ResponsecheckExist 请求成功
 * @response 400 ErrorResponse 参数问题登录失败
 * @response 409 ErrorResponseAlreadyRegistered 提供的username,email,phone已被注册
 * @response 601 ErrorResponseUnauthorized 未登录
 */
  async checkExist() {
    const { service, helper, request, validate, rule } = this.ctx
    const { email, username, phone } = request.body
    try {
      const passed = await validate.call(this, rule.RequestcheckExist, request.body)
      if (!passed) {
        const err = new Error('参数验证错误');
        err.status = 400;
        throw err;
      }
      if (email) {
        const result = await service.user.isEmailRegistered(email);
        if (result) {
          const err = new Error('邮箱已注册');
          err.status = 409;
          throw err;
        }
      }
      if (username) {
        const result = await service.user.isUsernameRegistered(username);
        console.log("用户名在这", result);
        if (result) {
          const err = new Error('用户名已注册');
          err.status = 409;
          throw err;
        }
      }
      console.log("333333");
      if (phone) {
        const result = await service.user.isPhoneRegistered(phone);
        if (result) {
          const err = new Error('用户名已注册');
          err.status = 409;
          throw err;
        }
      }
      helper.success(null, "未注册")
    } catch (error) {
      helper.error(error.status, error.message)
    }
  }


}
module.exports = UserController
