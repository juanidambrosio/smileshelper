const userRepository = require('../db/repositories/userRepository');

class MessageQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastProcessedTime = 0;
  }

  async addMessage(userId, message, callback) {
    const user = await userRepository.getById(userId);
    if (!user || user.active !== true) {
      return {
        error: true,
        message: 'Usuario no registrado o inactivo. Por favor regulariza tu cuenta primero para usar el bot.'
      };
    }

    const position = this.getUserPosition(userId);
    if (position !== -1) {
      return {
        error: true,
        message: `Tenes una consulta en espera en posición ${position + 1}. Luego de que finalice podrás hacer otra consulta.`,
        position
      };
    }

    this.queue.push({ userId, message, callback });
    return {
      error: false,
      message: `Consulta recibida. Estás en la posición ${this.queue.length} de la fila.`,
      position: this.queue.length
    };
  }

  getUserPosition(userId) {
    return this.queue.findIndex(item => item.userId === userId);
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    const now = Date.now();
    const timeSinceLastProcess = now - this.lastProcessedTime;
    const remainingTime = Math.max(60000 - timeSinceLastProcess, 0);

    if (timeSinceLastProcess < 60000) {
      setTimeout(() => this.processQueue(), remainingTime);
      return;
    }

    this.processing = true;
    const { userId, message, callback } = this.queue[0];

    try {
      await callback(message);
    } catch (error) {
      console.error('Error processing message:', error);
    }

    this.queue.shift();
    this.lastProcessedTime = Date.now();
    this.processing = false;

    // Always wait 60 seconds before processing the next message
    setTimeout(() => this.processQueue(), 60000);
  }
}

module.exports = new MessageQueue();