import React from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import "./App.css";

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      src: null, // 업로드할 image의 src
      crop: {
        // 크롭(편집)할 이미지의 정보
        unit: "px"
      }
    };
    this.handleClick = this.handleClick.bind(this);
  }

  /**
   *
   * @param {파일 변경 이벤트 오브젝트} e
   * @dev 파일 선택 버튼을 눌러서 파일을 업로드 할 때 발생하는 이벤트를 처리하는 함수
   */
  onSelectFile = e => {
    // 파일이 등록되면
    if (e.target.files && e.target.files.length > 0) {
      // HTML5 의 FileAPI 를 사용한다
      // FileReader 객체를 reader 에 저장
      const reader = new FileReader();

      // readAsDataURL로 파일을 읽는다
      reader.readAsDataURL(e.target.files[0]);

      // readAsDataURL 메서드 실행이 완료되면 onload 이벤트가 발생한다
      // 이 이벤트가 발생하면(읽기가 완료되면) 해당 이미지를 src state에 저장한다
      reader.addEventListener("load", () => {
        this.setState({ src: reader.result });
      });
    }
  };

  /**
   * @param {이미지 파일} image
   * @dev 이미지가 로드되었을 때 발생하는 콜백 함수이다
   *      이미지 DOM 을 우리 App 컴포넌트의 imageRef 로 지정하여
   *      쉽게 접근할 수 있게 만든다
   */
  onImageLoaded = image => {
    this.imageRef = image;
  };

  /**
   * @param {현재 state의 crop 오브젝트} crop
   * @param {현재 state의 crop 오브젝트(percent로 계산)} percentCrop
   * @dev 편집(크롭)되는 이미지가 조절될 때 마다 호출되는 콜백 함수이다
   *      반드시 이 콜백을 명시해 주어야 하고, state의 crop을 업데이트 시켜줘야 한다
   */
  onCropChange = (crop, percentCrop) => {
    // 퍼센트 크롭을 사용해도 된다:
    //this.setState({ crop: percentCrop });
    this.setState({ crop });
  };

  /**
   *
   * @param {현재 state의 crop 오브젝트} crop
   * @param {현재 state의 crop 오브젝트(percent로 계산)} percentCrop
   * @dev 리사이징(resizing), 드래그(drag) 등이 종료되었을 떄 발생하는 콜백 함수이다
   *      크롭된 이미지를 보여주는 makeClientCrop() 함수를 호출한다
   */
  onCropComplete = (crop, percentCrop) => {
    this.makeClientCrop(crop);
    console.log(this.state.crop);
  };

  /**
   *
   * @param {현재 state의 crop 오브젝트} crop
   * @dev 편집(크롭)된 이미지 부분을 클라이언트단에 보여주는 함수이다
   *      편집된 이미지URL을 현재 state의 croppedImageUrl 에 저장한다
   */
  async makeClientCrop(crop) {
    if (this.imageRef && crop.width && crop.height) {
      const croppedImageUrl = await this.getCroppedImg(
        this.imageRef,
        crop,
        "newFile.jpeg"
      );
      //console.log(croppedImageUrl);
      this.setState({ croppedImageUrl });
    }
  }

  /**
   *
   * @param {이미지 파일} image
   * @param {현재 state의 crop 오브젝트} crop
   * @param {이미지 파일 이름} fileName
   * @dev 크롭된 이미지 영역을 읽어들인다
   */
  getCroppedImg(image, crop, fileName) {
    const canvas = document.createElement("canvas"); // document 상에 canvas 태그 생성
    // 캔버스 영역을 크롭한 이미지 크기 만큼 조절
    canvas.width = crop.width;
    canvas.height = crop.height;
    // getContext() 메서드를 활용하여 캔버스 렌더링 컨텍스트 함수 사용
    // 이 경우 drawImage() 메서드를 활용하여 이미지를 그린다
    const ctx = canvas.getContext("2d");

    // 화면에 크롭된 이미지를 그린다
    ctx.drawImage(
      // 원본 이미지 영역
      image, // 원본 이미지
      crop.x, // 크롭한 이미지 x 좌표
      crop.y, // 크롭한 이미지 y 좌표
      crop.width, // 크롭한 이미지 가로 길이
      crop.height, // 크롭한 이미지 세로 길이
      // 캔버스 영역
      0, // 캔버스에서 이미지 시작 x 좌표
      0, // 캔버스에서 이미지 시작 y 좌표
      crop.width, // 캔버스에서 이미지 가로 길이
      crop.height //  캔버스에서 이미지 세로 길이
    );

    // canvas 이미지를 base64 형식으로 인코딩된 URI 를 생성한 후 반환한다
    return new Promise(resolve => {
      resolve(canvas.toDataURL());
    });
  }

  async handleClick(e) {
    const url = "/hello";
    fetch(url)
      .then(res => res.json())
      .then(data => console.log(data));
  }

  render() {
    const { crop, croppedImageUrl, src } = this.state;

    return (
      <div className="App">
        <div>
          <input type="file" onChange={this.onSelectFile} />
        </div>
        {src && (
          <ReactCrop
            src={src}
            crop={crop}
            onImageLoaded={this.onImageLoaded}
            onComplete={this.onCropComplete}
            onChange={this.onCropChange}
          />
        )}
        {croppedImageUrl && (
          <img alt="Crop" style={{ maxWidth: "100%" }} src={croppedImageUrl} />
        )}
        <button onClick={this.handleClick}>test</button>
      </div>
    );
  }
}
