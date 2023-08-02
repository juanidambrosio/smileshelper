FROM node:18

COPY . .

RUN chmod +x ./start.sh

CMD ["./start.sh"]